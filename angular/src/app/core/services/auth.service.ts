import { Injectable, inject } from '@angular/core';
import { 
  Auth,
  authState,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User as FirebaseUser
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc
} from '@angular/fire/firestore';
import { Observable, of, switchMap, map } from 'rxjs';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  currentUser$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(firebaseUser => {
      if (!firebaseUser) return of(null);
      const userDoc = doc(this.firestore, `accounts/${firebaseUser.uid}`);
      return docData(userDoc, { idField: 'id' }).pipe(
        map(data => {
          if (data && data['type'] === 'user') {
            return data as User;
          }
          return null;
        })
      );
    })
  );

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    await this.syncUserProfile(credential.user);
    return credential;
  }

  async signOut() {
    await signOut(this.auth);
  }

  private async syncUserProfile(firebaseUser: FirebaseUser) {
    const userRef = doc(this.firestore, `accounts/${firebaseUser.uid}`);
    const login = firebaseUser.email?.split('@')[0] || firebaseUser.uid;

    await setDoc(userRef, {
      id: firebaseUser.uid,
      type: 'user',
      login,
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || login,
      displayName: firebaseUser.displayName || login,
      email: firebaseUser.email,
      avatarURL: firebaseUser.photoURL,
      photoURL: firebaseUser.photoURL,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
  }
}


