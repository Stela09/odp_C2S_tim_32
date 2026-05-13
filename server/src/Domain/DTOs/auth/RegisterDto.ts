export class RegisterDto{
    constructor(
        public gamer_tag: string           = "",
        public full_name: string           = "",
        public email: string               = "",
        public password: string            = "",
        public profil_image: string | null = null,
    ) { }
}