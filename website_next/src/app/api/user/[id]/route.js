// src/app/api/user/[id]/route.js
import { handleGetUser, handleUpdateUser, handleDeleteUser } from "./core";

export async function GET({ params }) {
  return handleGetUser(params);
}

export async function PUT(request, { params }) {
  return handleUpdateUser(request, params);
}

export async function DELETE({ params }) {
  return handleDeleteUser(params);
}
