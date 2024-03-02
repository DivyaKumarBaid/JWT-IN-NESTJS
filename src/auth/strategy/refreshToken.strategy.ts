import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Jwt_Payload } from "src/types/user.types";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        config: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('RT_SECRET'),
            passReqToCallback: true,
            //passReqToCallBack actually pass the token to validate function
        });
    }
    validate(req: Request, payload: Jwt_Payload) {

        // since we get refresh token as req we have to find it and trim to get exact token
        const refreshToken = req.get('authorization').replace('Bearer', '').trim();

        //attaches paylaod to the res as res.user
        return { ...payload, refreshToken };
    }
}