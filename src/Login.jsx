import { auth, signInWithGoogle } from "./firebase.config";
import { useAuthState } from "react-firebase-hooks/auth";
const Login = () => {
  return (
    <>
      <h1>Login in to Continue</h1>
      <button type="button" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </>
  );
};

export default Login;
