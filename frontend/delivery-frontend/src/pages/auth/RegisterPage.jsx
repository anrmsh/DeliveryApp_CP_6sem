 import RegisterForm from "../../components/auth/RegisterForm";
 import LogisticsParticles from "../../components/particles/LogisticsParticles";

 export default function RegisterPage(){

   return(

     <div className="auth-page">

       <LogisticsParticles />

       <div className="auth-container">

         <RegisterForm/>

       </div>

     </div>

   )

 }
