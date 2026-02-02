import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '@/types';

export interface SessionData {
  userId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  rememberMe: boolean;
}

export class SessionManager {
  private static readonly USER_KEY = 'user_session';
  private static readonly REMEMBER_KEY = 'remember_me';

  static async saveUser(userData: UserData, rememberMe: boolean = false): Promise<void> {
    const sessionData: SessionData = {
      userId: userData.id,
      employeeCode: userData.employee_code,
      firstName: userData.first_name,
      lastName: userData.last_name,
      rememberMe,
    };

    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(sessionData));
    await AsyncStorage.setItem(this.REMEMBER_KEY, JSON.stringify(rememberMe));
  }

  static async getUser(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.USER_KEY);
      if (!sessionData) return null;

      return JSON.parse(sessionData) as SessionData;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  static async shouldAutoLogin(): Promise<boolean> {
    try {
      const rememberMe = await AsyncStorage.getItem(this.REMEMBER_KEY);
      const user = await this.getUser();
      
      return rememberMe === 'true' && user !== null;
    } catch (error) {
      console.error('Error checking auto-login:', error);
      return false;
    }
  }

  static async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(this.USER_KEY);
    await AsyncStorage.removeItem(this.REMEMBER_KEY);
  }

  static async updateRememberMe(rememberMe: boolean): Promise<void> {
    await AsyncStorage.setItem(this.REMEMBER_KEY, JSON.stringify(rememberMe));
  }

  static async getAuthToken(): Promise<string | null> {
    // This could be extended to return JWT tokens if your API uses them
    const user = await this.getUser();
    return user ? `user_${user.userId}_${user.employeeCode}` : null;
  }
}

export default SessionManager;
