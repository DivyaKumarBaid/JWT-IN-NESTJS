import { IsEmail, IsNotEmpty } from "class-validator";

export class SignupAuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    username: string;
}

export class SigninAuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;
}

export class PasswordAuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

