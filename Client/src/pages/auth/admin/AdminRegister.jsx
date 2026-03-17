import { RegisterForm } from "@/components/auth/RegisterForm";

import React from 'react'

export default function AdminRegister() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <RegisterForm role="ADMIN" />
    </div>
  )
}

