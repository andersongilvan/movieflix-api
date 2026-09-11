export interface UserPayload {
  sub: string
  name: string
  email: string
  role: UserRole
  type?: 'access' | 'refresh'
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

export {}
