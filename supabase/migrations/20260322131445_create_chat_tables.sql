-- 1. 채팅방 테이블
CREATE TABLE public.chat_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. 채팅방 참여자 테이블 (N:M 관계)
CREATE TABLE public.chat_participants (
    room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

-- 3. 메시지 테이블
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 성능을 위한 인덱스 추가
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- [RLS 정책] 채팅방: 내가 참여한 방만 볼 수 있음
CREATE POLICY "Participants can view their rooms" ON public.chat_rooms
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE room_id = id AND user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Authenticated users can create rooms" ON public.chat_rooms
FOR INSERT TO authenticated
WITH CHECK (true);

-- [RLS 정책] 참여자: 나와 같은 방에 있는 사람들의 목록을 볼 수 있음
CREATE POLICY "Participants can view room participants" ON public.chat_participants
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid()) OR 
    room_id IN (
        SELECT room_id FROM public.chat_participants WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Authenticated users can add participants" ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (true);

-- 내 참여 정보(마지막 읽은 시간 등)는 나만 업데이트 가능
CREATE POLICY "Users can update their own participant record" ON public.chat_participants
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- [RLS 정책] 메시지: 내가 참여한 방의 메시지만 볼 수 있고, 내 이름으로만 보낼 수 있음
CREATE POLICY "Participants can view messages" ON public.messages
FOR SELECT TO authenticated
USING (
    room_id IN (
        SELECT room_id FROM public.chat_participants WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Participants can insert messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    room_id IN (
        SELECT room_id FROM public.chat_participants WHERE user_id = (SELECT auth.uid())
    )
);

-- 4. 실시간(Realtime) 설정: 메시지 테이블을 실시간 감시 대상으로 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
