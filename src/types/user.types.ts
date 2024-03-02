export interface Unverified_User_Type {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    username: string;
    password: string;
    otp?: string;
}

export interface User_Type {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    username: string;
    password: string;
    hashRT?: string;
    role: string;
    signInMethod: string;
}

export interface Jwt_Payload {
    sub: string;
    email: string;
}