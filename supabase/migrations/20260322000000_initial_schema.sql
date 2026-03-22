drop extension if exists "pg_net";


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "label" text not null,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."comments" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "author_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "parent_id" uuid
      );


alter table "public"."comments" enable row level security;


  create table "public"."follows" (
    "follower_id" uuid not null,
    "following_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."follows" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_id" uuid not null,
    "type" text not null,
    "post_id" uuid not null,
    "comment_id" uuid not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."post_images" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "image_url" text not null,
    "storage_path" text not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "width" integer,
    "height" integer
      );


alter table "public"."post_images" enable row level security;


  create table "public"."post_likes" (
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."post_likes" enable row level security;


  create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "author_id" uuid not null,
    "description" text,
    "thumbnail_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "category_id" uuid not null,
    "audio_url" text,
    "audio_storage_path" text
      );


alter table "public"."posts" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "username" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "bio" text
      );


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (follower_id, following_id);

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);

CREATE INDEX idx_post_images_post_id_sort_order ON public.post_images USING btree (post_id, sort_order);

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX post_images_pkey ON public.post_images USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."post_images" add constraint "post_images_pkey" PRIMARY KEY using index "post_images_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."comments" add constraint "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_author_id_fkey";

alter table "public"."comments" add constraint "comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_parent_id_fkey";

alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_post_id_fkey";

alter table "public"."follows" add constraint "cannot_follow_self" CHECK ((follower_id <> following_id)) not valid;

alter table "public"."follows" validate constraint "cannot_follow_self";

alter table "public"."follows" add constraint "follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_id_fkey";

alter table "public"."follows" add constraint "follows_following_id_fkey" FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_following_id_fkey";

alter table "public"."notifications" add constraint "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_actor_id_fkey";

alter table "public"."notifications" add constraint "notifications_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_comment_id_fkey";

alter table "public"."notifications" add constraint "notifications_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_post_id_fkey";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['COMMENT'::text, 'REPLY'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."post_images" add constraint "post_images_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_images" validate constraint "post_images_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."posts" add constraint "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_author_id_fkey";

alter table "public"."posts" add constraint "posts_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."posts" validate constraint "posts_category_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

set check_function_bodies = off;

create or replace view "public"."explore_posts_with_author" as  SELECT p.id,
    p.description,
    p.thumbnail_url,
    p.audio_url,
    p.category_id,
    p.created_at,
    pr.username AS author_username,
    pr.id AS author_id,
    pr.avatar_url AS author_avatar_url
   FROM (public.posts p
     JOIN public.profiles pr ON ((p.author_id = pr.id)));


CREATE OR REPLACE FUNCTION public.get_home_feed(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, author_id uuid, description text, thumbnail_url text, audio_url text, category_id uuid, created_at timestamp with time zone, author_username text, likes_count bigint, comments_count bigint, score double precision, width integer, height integer, author_avatar_url text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH engagement AS (
    SELECT 
      e_p.id AS post_id,
      COUNT(DISTINCT e_pl.user_id) AS l_count,
      COUNT(DISTINCT e_c.id) AS c_count
    FROM public.posts e_p
    LEFT JOIN public.post_likes e_pl ON e_p.id = e_pl.post_id
    LEFT JOIN public.comments e_c ON e_p.id = e_c.post_id
    GROUP BY e_p.id
  ),
  user_pref_likes AS (
    SELECT 
      pref_p.category_id AS pref_cat_id,
      COUNT(*) * 8.0 AS weight
    FROM public.posts pref_p
    JOIN public.post_likes pref_pl ON pref_p.id = pref_pl.post_id
    WHERE pref_pl.user_id = p_user_id
    GROUP BY pref_p.category_id
  ),
  user_pref_comments AS (
    SELECT 
      pref_p.category_id AS pref_cat_id,
      COUNT(*) * 10.0 AS weight
    FROM public.posts pref_p
    JOIN public.comments pref_c ON pref_p.id = pref_c.post_id
    WHERE pref_c.author_id = p_user_id
    GROUP BY pref_p.category_id
  ),
  agg_preferences AS (
    SELECT comb.pref_cat_id, SUM(comb.weight) AS total_weight
    FROM (
      SELECT * FROM user_pref_likes
      UNION ALL
      SELECT * FROM user_pref_comments
    ) comb
    GROUP BY comb.pref_cat_id
  ),
  followed_authors AS (
    SELECT f.following_id FROM public.follows f WHERE f.follower_id = p_user_id
  ),
  post_dims AS (
    SELECT DISTINCT ON (pi.post_id)
      pi.post_id,
      COALESCE(pi.width, 800) AS post_w,
      COALESCE(pi.height, 800) AS post_h
    FROM public.post_images pi
    ORDER BY pi.post_id, pi.sort_order ASC
  )
  SELECT 
    p.id,
    p.author_id,
    p.description,
    p.thumbnail_url,
    p.audio_url,
    p.category_id,
    p.created_at,
    pr.username AS author_username,
    e.l_count AS likes_count,
    e.c_count AS comments_count,
    (
      (CASE WHEN p.author_id = p_user_id AND p.created_at > (now() - interval '1 hour') THEN 200.0 ELSE 0.0 END) +
      (CASE WHEN p.author_id IN (SELECT following_id FROM followed_authors) THEN 100.0 ELSE 0.0 END) +
      COALESCE(ap.total_weight, 0.0) +
      (e.l_count * 1.0 + e.c_count * 2.0) +
      (50.0 / (1.0 + EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0))
    )::FLOAT8 AS score,
    pd.post_w AS width,
    pd.post_h AS height,
    pr.avatar_url AS author_avatar_url
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  JOIN engagement e ON p.id = e.post_id
  LEFT JOIN post_dims pd ON p.id = pd.post_id
  LEFT JOIN agg_preferences ap ON p.category_id = ap.pref_cat_id
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_user_id uuid;
  notification_type text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- ?듦???寃쎌슦 ?먮뙎湲 ?묒꽦??李얘린
    SELECT author_id INTO target_user_id FROM public.comments WHERE id = NEW.parent_id;
    notification_type := 'REPLY';
  ELSE
    -- ?쇰컲 ?볤???寃쎌슦 寃뚯떆湲 ?묒꽦??李얘린
    SELECT author_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    notification_type := 'COMMENT';
  END IF;

  -- ?먭린 ?먯떊?먭쾶???뚮┝???앹꽦?섏? ?딆쓬
  IF target_user_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id)
    VALUES (target_user_id, NEW.author_id, notification_type, NEW.post_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    temp_username text;
BEGIN
    -- 媛?ν븳 ?대쫫 ?꾨뱶?ㅼ쓣 ?쒖감?곸쑝濡??뺤씤
    temp_username := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'nickname',
        split_part(new.email, '@', 1),
        'user'
    );

    -- username 以묐났 ???ㅼ뿉 ?좎? ID ??4?먮━ 異붽?
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = temp_username) THEN
        temp_username := temp_username || '_' || substring(new.id::text from 1 for 4);
    END IF;

    -- ?꾨줈???뺣낫 ?쎌엯 (avatar_url? ?쒖쇅)
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        new.id,
        temp_username,
        NULL
    );
    
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$function$
;

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant references on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant trigger on table "public"."comments" to "anon";

grant truncate on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant references on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant trigger on table "public"."comments" to "authenticated";

grant truncate on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant references on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant trigger on table "public"."comments" to "service_role";

grant truncate on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant references on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant trigger on table "public"."follows" to "anon";

grant truncate on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant references on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant trigger on table "public"."follows" to "authenticated";

grant truncate on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant references on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant trigger on table "public"."follows" to "service_role";

grant truncate on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."post_images" to "anon";

grant insert on table "public"."post_images" to "anon";

grant references on table "public"."post_images" to "anon";

grant select on table "public"."post_images" to "anon";

grant trigger on table "public"."post_images" to "anon";

grant truncate on table "public"."post_images" to "anon";

grant update on table "public"."post_images" to "anon";

grant delete on table "public"."post_images" to "authenticated";

grant insert on table "public"."post_images" to "authenticated";

grant references on table "public"."post_images" to "authenticated";

grant select on table "public"."post_images" to "authenticated";

grant trigger on table "public"."post_images" to "authenticated";

grant truncate on table "public"."post_images" to "authenticated";

grant update on table "public"."post_images" to "authenticated";

grant delete on table "public"."post_images" to "service_role";

grant insert on table "public"."post_images" to "service_role";

grant references on table "public"."post_images" to "service_role";

grant select on table "public"."post_images" to "service_role";

grant trigger on table "public"."post_images" to "service_role";

grant truncate on table "public"."post_images" to "service_role";

grant update on table "public"."post_images" to "service_role";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant references on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant trigger on table "public"."post_likes" to "anon";

grant truncate on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant delete on table "public"."post_likes" to "authenticated";

grant insert on table "public"."post_likes" to "authenticated";

grant references on table "public"."post_likes" to "authenticated";

grant select on table "public"."post_likes" to "authenticated";

grant trigger on table "public"."post_likes" to "authenticated";

grant truncate on table "public"."post_likes" to "authenticated";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_likes" to "service_role";

grant insert on table "public"."post_likes" to "service_role";

grant references on table "public"."post_likes" to "service_role";

grant select on table "public"."post_likes" to "service_role";

grant trigger on table "public"."post_likes" to "service_role";

grant truncate on table "public"."post_likes" to "service_role";

grant update on table "public"."post_likes" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "Categories are viewable by everyone."
  on "public"."categories"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can create comments."
  on "public"."comments"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Authors can delete own comments."
  on "public"."comments"
  as permissive
  for delete
  to public
using ((auth.uid() = author_id));



  create policy "Authors can update own comments."
  on "public"."comments"
  as permissive
  for update
  to public
using ((auth.uid() = author_id));



  create policy "Comments are viewable by everyone."
  on "public"."comments"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can view follows"
  on "public"."follows"
  as permissive
  for select
  to public
using (true);



  create policy "Users can follow others"
  on "public"."follows"
  as permissive
  for insert
  to public
with check ((auth.uid() = follower_id));



  create policy "Users can unfollow"
  on "public"."follows"
  as permissive
  for delete
  to public
using ((auth.uid() = follower_id));



  create policy "Users can update own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Post authors can manage images."
  on "public"."post_images"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_images.post_id) AND (posts.author_id = auth.uid())))));



  create policy "Post images are viewable by everyone."
  on "public"."post_images"
  as permissive
  for select
  to public
using (true);



  create policy "Likes are viewable by everyone."
  on "public"."post_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Users can toggle own likes."
  on "public"."post_likes"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Authenticated users can create posts."
  on "public"."posts"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Authors can delete own posts."
  on "public"."posts"
  as permissive
  for delete
  to public
using ((auth.uid() = author_id));



  create policy "Authors can update own posts."
  on "public"."posts"
  as permissive
  for update
  to public
using ((auth.uid() = author_id));



  create policy "Posts are viewable by everyone."
  on "public"."posts"
  as permissive
  for select
  to public
using (true);



  create policy "Public profiles are viewable by everyone."
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can update own profile."
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_comment_created AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment_notification();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated users can upload images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'post-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public read access to images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'post-images'::text));




