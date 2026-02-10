/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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
  Select,
  MenuItem,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/firebase/firebase";

import "./signup.css";
import { useAppDispatch } from "@/app/utils/hooks";
import { registerUser } from "@/redux/authSlice";

/* ---------------- schema ---------------- */

const RoleSchema = z.enum(["user", "seller"]);

const RegisterUserSchema = z
  .object({
    username: z.string().min(4, "Username should be of minimum 4 characters"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => !val.includes(" "), {
        message: "Password must not contain spaces",
      }),
    role: RoleSchema,
    cpassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.cpassword, {
    path: ["cpassword"],
    message: "Confirm Password and Password doesn't match",
  });

type RegisterFormData = z.infer<typeof RegisterUserSchema>;

export default function Register() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const showSnackbar = (message: string) =>
    setSnackbar({ open: true, message });

  const handleClose = (
    _: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /* 🔑 ONLY IMPORTANT CHANGE IS HERE */
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterUserSchema),
    mode: "onChange",
    defaultValues: {
      role: "user", // ✅ FIXES MUI ERROR (NO STYLE CHANGE)
    },
  });

  /* ---------------- handlers ---------------- */

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      await dispatch(
        registerUser({
          userid: res.user.uid,
          email: data.email,
          username: data.username,
          password: data.password,
          role: data.role,
        }),
      ).unwrap();

      reset({ role: "user" });
      showSnackbar("Registration successful");
      setTimeout(() => router.push("/"), 500);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        showSnackbar("Email already registered");
      } else {
        showSnackbar("Registration failed");
      }
    }
  };

  const handleSignin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);

      await dispatch(
        registerUser({
          userid: res.user.uid,
          email: res.user.email,
          username: res.user.displayName,
          role: "user",
          password: "123456",
        }),
      ).unwrap();

      showSnackbar("Registration successful");
      setTimeout(() => router.push("/"), 500);
    } catch {
      showSnackbar("Not able to sign in with Google");
    }
  };

  /* ---------------- UI (UNCHANGED) ---------------- */

  return (
    <>
      <div className="Design">
        <Typography
          sx={{ fontFamily: '"Dancing Script", cursive' }}
          variant="h3"
        >
          Instagram
        </Typography>

        <p>Sign up to see photos and videos from your friends.</p>

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleSignin}
        >
          Sign up with Google
        </Button>

        <form onSubmit={handleSubmit(handleRegister)}>
          <TextField
            sx={{ mb: 2 }}
            fullWidth
            label="Name"
            {...register("username")}
            error={!!errors.username}
            helperText={errors.username?.message}
          />

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

          <FormControl fullWidth error={!!errors.cpassword}>
            <InputLabel>Confirm Password</InputLabel>
            <OutlinedInput
              sx={{ mb: 2 }}
              type={showPassword ? "text" : "password"}
              {...register("cpassword")}
            />
            <FormHelperText>{errors.cpassword?.message}</FormHelperText>
          </FormControl>

          <Controller
            name="role"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>Role</InputLabel>
                <Select {...field} label="Role">
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                </Select>
                {fieldState.error && (
                  <Typography variant="caption" color="error">
                    {fieldState.error.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Register
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            Already have an account? <Link href="/">Login</Link>
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
