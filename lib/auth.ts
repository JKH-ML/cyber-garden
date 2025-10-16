import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  email: string;
  nickname: string;
  profile_color: string | null;
  profile_image: string | null;
  created_at: string;
};

// 파스텔톤 색상 8개
export const PASTEL_COLORS = [
  '#FFB3BA', // 파스텔 핑크
  '#FFDFBA', // 파스텔 피치
  '#FFFFBA', // 파스텔 옐로우
  '#BAFFC9', // 파스텔 민트
  '#BAE1FF', // 파스텔 블루
  '#D4BAFF', // 파스텔 라벤더
  '#FFB3E6', // 파스텔 매젠타
  '#C9FFBA', // 파스텔 라임
];

export const getRandomPastelColor = () => {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
};

export const signUp = async (email: string, password: string, nickname: string, profileImage?: File) => {
  try {
    let profileImageUrl: string | null = null;
    let profileColor: string | null = null;

    // 프로필 이미지가 없으면 랜덤 파스텔 색상 지정
    if (!profileImage) {
      profileColor = getRandomPastelColor();
    }

    // 1. 회원가입 with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          profile_color: profileColor,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. 프로필 이미지 업로드
    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, profileImage);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }
    }

    // 3. 프로필 정보 저장 (세션이 있는 경우에만)
    if (authData.session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          nickname,
          profile_color: profileColor,
          profile_image: profileImageUrl,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // 프로필 생성 실패해도 회원가입은 성공으로 처리
      }
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
};

export const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 자동 로그인 설정
    if (rememberMe) {
      await supabase.auth.updateUser({
        data: { remember_me: true }
      });
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return null;

    // 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // 프로필이 아직 생성되지 않은 경우 (회원가입 직후) 정상적인 상황
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    // 예상치 못한 에러만 로그
    console.error('Get current user error:', error);
    return null;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};
