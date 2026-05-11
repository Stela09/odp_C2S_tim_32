import { UserRole } from "../enums/UserRole";

export class User {

   public id: number;
   public gamer_tag: string;
   public full_name: string;
   public email: string;
   public password_hash: string;
   public profil_image: string | null;
   public role: UserRole = UserRole.USER;
   public createdAt: Date;

  constructor() 
  {
    this.id = 0;
    this.gamer_tag = "";
    this.full_name= "";
    this.email= "";
    this.password_hash = "";
    this.profil_image = null;
    this.role = UserRole.USER ;
    this.createdAt = new Date();


  }
}
