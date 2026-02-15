/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Snackbar from "@mui/material/Snackbar";
import {
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";

import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import { auth, provider } from "@/firebase/firebase";
import "./login.css";
import { loginUser, socialLogin } from "@/redux/authSlice";
import { useDispatch } from "react-redux";
import { useAppDispatch } from "@/app/utils/hooks";

const LoginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(8, "Password should be of 8 characters"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function Login() {
  const dispatch = useAppDispatch()
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const showSnackbar = (message: string) => {
    setSnackbar({ open: true, message });
  };

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleLogin = async (data: LoginFormData) => {
    try {
      const { email, password } = data;
      const res = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      const user = res.user;

      const userData = {
        userid: user.uid ?? Date.now().toString(),
        email: user.email,
        username: user.displayName,
        password: data.password,
      };
      await dispatch(loginUser(userData)).unwrap();;
      showSnackbar("User Logged In Successfully");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (e) {
      showSnackbar("Invalid Username Or Password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
     const res= await signInWithPopup(auth, provider);
            const user = res.user;

      const userData = {
        userid: user.uid,
        email: user.email,
        username: user.displayName,
        role: "user",
        password: "123456",
      };
      await dispatch(socialLogin(userData)).unwrap();;

      showSnackbar("User Logged In Successfully");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      showSnackbar("Google Sign In Failed");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="DesignLogin">
        <Typography
          sx={{ fontFamily: '"Dancing Script", cursive' }}
          variant="h3"
        >
          Instagram
        </Typography>

        <p>Login to see photos and videos from your friends.</p>

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleGoogleLogin}
        >
          Login with Google
        </Button>

        <form onSubmit={handleSubmit(handleLogin)}>
          <TextField
            sx={{ mb: 2 }}
            fullWidth
            label="Email Address"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <FormControl fullWidth error={!!errors.password}>
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              sx={{ mb: 2 }}
              type={showPassword ? "text" : "password"}
              {...register("password")}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
            <FormHelperText>{errors.password?.message}</FormHelperText>
          </FormControl>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Login
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            Don’t have an account? <Link href="/authentication/signup">Sign up</Link>
          </Typography>
        </form>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={snackbar.message}
      />
    </>
  );
}
