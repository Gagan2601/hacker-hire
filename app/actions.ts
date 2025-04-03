"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const setUsernameAction = async (formData: FormData) => {
  const username = formData.get("username") as string;
  const supabase = await createClient();

  // Get the authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userData?.user || userError) {
    return encodedRedirect("error", "/sign-in", "User not authenticated");
  }

  const userId = userData.user.id;
  const email = userData.user.email; // Storing email for reference

  // Check if the username is already taken
  const { data: existingUsername } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUsername) {
    return encodedRedirect(
      "error",
      "/set-username",
      "Username is already taken."
    );
  }

  // Check if user already exists in `users` table
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (existingUser) {
    return encodedRedirect(
      "error",
      "/set-username",
      "Username is already set."
    );
  }

  // Insert new user with username
  const { error: insertError } = await supabase.from("users").insert([
    {
      id: userId,
      email, // Store email for reference
      username,
    },
  ]);

  if (insertError) {
    console.error("Insert User Error:", insertError.message);
    return encodedRedirect("error", "/set-username", "Failed to set username.");
  }

  return redirect("/");
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Get the authenticated user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return encodedRedirect("error", "/sign-in", "Failed to get user data");
  }

  // Check if the user has a username set
  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.username) {
    return redirect("/set-username");
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const getUser = async () => {
  const supabase = await createClient(); // Await the server client
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
};
