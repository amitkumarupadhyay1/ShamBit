import { Injectable } from '@nestjs/common';
import { auth, Session, User } from './better-auth.config';

@Injectable()
export class BetterAuthService {
  private authInstance = auth;

  /**
   * Get the Better Auth instance
   */
  getAuth() {
    return this.authInstance;
  }

  /**
   * Verify a session token
   */
  async verifySession(sessionToken: string): Promise<{ session: Session; user: User } | null> {
    try {
      const result = await this.authInstance.api.getSession({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      if (result) {
        return {
          session: result,
          user: result.user,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    roles?: string[];
  }) {
    try {
      const result = await this.authInstance.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const result = await this.authInstance.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(sessionToken: string) {
    try {
      const result = await this.authInstance.api.signOut({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // This would typically be done through the database
      // Better Auth doesn't have a direct getUserById method
      // You would query your database directly
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: Partial<User>) {
    try {
      // This would typically be done through the database
      // Better Auth doesn't have a direct updateUser method
      // You would update your database directly
      return null;
    } catch (error) {
      throw error;
    }
  }
}