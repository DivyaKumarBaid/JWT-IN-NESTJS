import { IsNotEmpty } from "class-validator";

export class SigninGoogleAuthDto {
    @IsNotEmpty()
    token: string;
}