import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { Jwt_Payload } from "src/types/user.types";

@Injectable()
export class AtStratergy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('AT_SECRET')
        });
    }
    validate(payload: Jwt_Payload) {
        //attaches paylaod to the res as res.user
        return payload;
    }
}