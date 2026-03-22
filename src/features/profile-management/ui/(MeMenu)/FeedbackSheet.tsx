import { ChevronRight, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/src/shared/ui/sheet';
import AppSheetHeader from '@/src/shared/ui/AppSheetHeader';

const FEEDBACK_LINKS = [
  {
    title: '버그 제보하기',
    description: '서비스 이용 중 불편한 점이 있나요?',
    url: 'https://naver.me/FAA6KVCo',
    icon: Bug,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    title: '기능 제안하기',
    description: '이런 기능이 있으면 더 좋겠어요!',
    url: 'https://naver.me/5SKsRzFI',
    icon: Lightbulb,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    title: '기타 문의하기',
    description: '궁금한 점이나 전하고 싶은 말씀이 있나요?',
    url: 'https://naver.me/FKGsJQYm',
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
];

/**
 * 의견 보내기 시트 컴포넌트입니다.
 */
export const FeedbackSheet = () => {
  return (
    <Sheet>
      <SheetTrigger className="flex w-full items-center justify-between rounded-lg px-2 py-4 text-left text-sm font-medium text-neutral-700 transition-colors outline-none hover:bg-neutral-50 cursor-pointer">
        <span>의견 보내기</span>
        <ChevronRight className="size-4 text-neutral-300" />
      </SheetTrigger>
      <SheetContent showCloseButton={false} side="right" className="border-none p-0 shadow-2xl bg-white">
        <AppSheetHeader title="의견 보내기" />
        
        <div className="flex flex-col gap-2 p-4">
          <p className="mb-4 px-2 text-sm font-medium text-neutral-500 leading-relaxed">
            더 나은 자랑(ZARANG)을 위해<br />
            소중한 의견을 들려주세요! 😊
          </p>

          {FEEDBACK_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 p-4 transition-all hover:bg-neutral-50 active:scale-[0.98]"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${link.bgColor} ${link.color}`}>
                <link.icon className="size-5" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-neutral-800">{link.title}</span>
                <span className="text-xs text-neutral-500">{link.description}</span>
              </div>
              <ChevronRight className="size-4 text-neutral-300" />
            </a>
          ))}
        </div>

        <div className="mt-auto p-8 text-center">
          <p className="text-[11px] text-neutral-400 italic">
            보내주신 의견은 꼼꼼히 읽어보고 서비스 개선에 참고할게요.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
