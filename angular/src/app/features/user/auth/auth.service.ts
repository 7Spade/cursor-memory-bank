import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth) {}

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signup(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  /**
   * Google 社交登入
   */
  signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    
    // 添加額外的 scope (可選)
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // 設定自定義參數 (可選)
    provider.setCustomParameters({
      'login_hint': 'user@example.com'
    });
    
    return signInWithPopup(this.auth, provider);
  }

  get user() {
    return this.auth.currentUser;
  }
}
