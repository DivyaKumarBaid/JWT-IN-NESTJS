import { IsEmail, IsNotEmpty } from "class-validator";

export class OTPAuthDto {
    @IsNotEmpty()
    id: number;

    @IsNotEmpty()
    otp: string;
}
export class OtpPasswordDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    otp: string;
}