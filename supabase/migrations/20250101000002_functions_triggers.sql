-- Function to create notification for new comment
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  parent_author_id UUID;
  actor_nickname TEXT;
BEGIN
  -- Get actor's nickname
  SELECT nickname INTO actor_nickname
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Get post author
  SELECT author_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- If this is a reply to another comment
  IF NEW.parent_id IS NOT NULL THEN
    -- Get parent comment author
    SELECT author_id INTO parent_author_id
    FROM public.comments
    WHERE id = NEW.parent_id;

    -- Create notification for parent comment author (if not self)
    IF parent_author_id != NEW.author_id THEN
      INSERT INTO public.notifications (user_id, type, content, post_id, comment_id, actor_id)
      VALUES (
        parent_author_id,
        'reply',
        actor_nickname || '님이 댓글에 답글을 달았습니다',
        NEW.post_id,
        NEW.id,
        NEW.author_id
      );
    END IF;
  END IF;

  -- Create notification for post author (if not self and not already notified)
  IF post_author_id != NEW.author_id AND (NEW.parent_id IS NULL OR post_author_id != parent_author_id) THEN
    INSERT INTO public.notifications (user_id, type, content, post_id, comment_id, actor_id)
    VALUES (
      post_author_id,
      'comment',
      actor_nickname || '님이 게시글에 댓글을 달았습니다',
      NEW.post_id,
      NEW.id,
      NEW.author_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for post up
CREATE OR REPLACE FUNCTION create_post_up_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  actor_nickname TEXT;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Get actor's nickname
  SELECT nickname INTO actor_nickname
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification for post author (if not self)
  IF post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, post_id, actor_id)
    VALUES (
      post_author_id,
      'up',
      actor_nickname || '님이 게시글에 UP을 눌렀습니다',
      NEW.post_id,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for comment like
CREATE OR REPLACE FUNCTION create_comment_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  comment_author_id UUID;
  comment_post_id UUID;
  actor_nickname TEXT;
BEGIN
  -- Get comment author and post
  SELECT author_id, post_id INTO comment_author_id, comment_post_id
  FROM public.comments
  WHERE id = NEW.comment_id;

  -- Get actor's nickname
  SELECT nickname INTO actor_nickname
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification for comment author (if not self)
  IF comment_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, post_id, comment_id, actor_id)
    VALUES (
      comment_author_id,
      'like',
      actor_nickname || '님이 댓글을 좋아합니다',
      comment_post_id,
      NEW.comment_id,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_color TEXT;
BEGIN
  -- Generate random color for avatar
  random_color := '#' || LPAD(TO_HEX((RANDOM() * 16777215)::INT), 6, '0');

  -- Create profile for new user
  INSERT INTO public.profiles (id, username, nickname, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
    random_color
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

CREATE TRIGGER on_post_up_created
  AFTER INSERT ON public.post_ups
  FOR EACH ROW
  EXECUTE FUNCTION create_post_up_notification();

CREATE TRIGGER on_comment_like_created
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_like_notification();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to get post with counts (ups, comments)
CREATE OR REPLACE FUNCTION get_post_with_counts(post_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  author_id UUID,
  category_id UUID,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ups_count BIGINT,
  comments_count BIGINT,
  author_nickname TEXT,
  author_avatar_url TEXT,
  author_avatar_color TEXT,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.category_id,
    p.thumbnail_url,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT pu.id) AS ups_count,
    COUNT(DISTINCT c.id) AS comments_count,
    prof.nickname AS author_nickname,
    prof.avatar_url AS author_avatar_url,
    prof.avatar_color AS author_avatar_color,
    cat.name AS category_name
  FROM public.posts p
  LEFT JOIN public.post_ups pu ON p.id = pu.post_id
  LEFT JOIN public.comments c ON p.id = c.post_id
  LEFT JOIN public.profiles prof ON p.author_id = prof.id
  LEFT JOIN public.categories cat ON p.category_id = cat.id
  WHERE p.id = post_uuid
  GROUP BY p.id, prof.nickname, prof.avatar_url, prof.avatar_color, cat.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get comment with counts (likes)
CREATE OR REPLACE FUNCTION get_comment_with_counts(comment_uuid UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  author_id UUID,
  content TEXT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  likes_count BIGINT,
  author_nickname TEXT,
  author_avatar_url TEXT,
  author_avatar_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    co.id,
    co.post_id,
    co.author_id,
    co.content,
    co.parent_id,
    co.created_at,
    co.updated_at,
    COUNT(DISTINCT cl.id) AS likes_count,
    prof.nickname AS author_nickname,
    prof.avatar_url AS author_avatar_url,
    prof.avatar_color AS author_avatar_color
  FROM public.comments co
  LEFT JOIN public.comment_likes cl ON co.id = cl.comment_id
  LEFT JOIN public.profiles prof ON co.author_id = prof.id
  WHERE co.id = comment_uuid
  GROUP BY co.id, prof.nickname, prof.avatar_url, prof.avatar_color;
END;
$$ LANGUAGE plpgsql;
