'use client'

import {
  Archive,
  BookOpen,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  Cloud,
  HardDrive,
  Link,
  Link2Off,
  Loader2,
  MessageCircle,
  Send,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getApiConnections, type ApiConnection } from '@/lib/mock-data/settings'

type Tab = 'profile' | 'api' | 'users'

const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'api', label: 'API Connections' },
  { id: 'users', label: 'User Management', adminOnly: true },
]

const iconMap: Record<string, React.ReactNode> = {
  brain: <Brain className="size-5" />,
  'hard-drive': <HardDrive className="size-5" />,
  'message-circle': <MessageCircle className="size-5" />,
  'book-open': <BookOpen className="size-5" />,
  cloud: <Cloud className="size-5" />,
  users: <Users className="size-5" />,
  archive: <Archive className="size-5" />,
  send: <Send className="size-5" />,
}

type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'

const roles: UserRole[] = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  HR: 'bg-emerald-100 text-emerald-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-muted text-muted-foreground',
}

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  lastLogin: string | null
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('') || '?'
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ProfileTab() {
  const [name, setName] = useState('Ava Chen')
  const [email, setEmail] = useState('ava.chen@company.com')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="size-24">
              <AvatarFallback className="text-2xl font-bold">AC</AvatarFallback>
            </Avatar>
            <button
              id="change-avatar-button"
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow hover:bg-primary/90"
              aria-label="Change profile photo"
            >
              <Camera className="size-3.5" />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            JPG or PNG, max 2 MB
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Update your name and email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} id="profile-form" className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="profile-name">Display Name</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Role</label>
              <input
                value="Platform Admin"
                disabled
                className="rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" id="save-profile-button" className="gap-2">
                {saved ? <><Check className="size-4" /> Saved!</> : 'Save Changes'}
              </Button>
              {saved && <p className="text-sm text-success">Profile updated successfully.</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ApiConnectionsTab() {
  const initial = getApiConnections()
  const [connections, setConnections] = useState<ApiConnection[]>(initial)

  function toggleConnection(id: string) {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Connected' ? 'Not Connected' : 'Connected' }
          : c,
      ),
    )
  }

  const categories = [...new Set(connections.map((c) => c.category))]

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => (
        <Card key={cat} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {connections.filter((c) => c.category === cat).map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"
                id={`api-connection-${conn.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {iconMap[conn.icon] ?? <Cloud className="size-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{conn.name}</p>
                    <p className="text-xs text-muted-foreground">{conn.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      conn.status === 'Connected' ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {conn.status}
                  </span>
                  <Button
                    variant={conn.status === 'Connected' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleConnection(conn.id)}
                    id={`connect-${conn.id}`}
                    className="gap-1.5"
                  >
                    {conn.status === 'Connected' ? (
                      <><Link2Off className="size-3" /> Disconnect</>
                    ) : (
                      <><Link className="size-3" /> Connect</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type ToastState = { id: number; kind: 'success' | 'error'; message: string }

function SettingsToast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  const Icon = toast.kind === 'success' ? CheckCircle2 : XCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-2xl"
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          toast.kind === 'success' ? 'text-green-600' : 'text-red-500',
        )}
      />
      <p className="max-w-xs text-[13px] font-medium text-gray-900">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-900"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

const fieldClass =
  'rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#F5CA50] focus:border-[#F5CA50] shadow-sm transition-all'

const labelClass = 'text-[13px] font-bold text-gray-900 uppercase tracking-wide'

function AddUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (user: AppUser) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('EMPLOYEE')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim() !== '' && email.trim() !== '' && password.length >= 8

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSaving || !canSubmit) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? 'Could not create this user.')

      onCreated(body.user as AppUser)
      onClose()
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        id="add-user-form"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 md:p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add User</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5 text-gray-500" />
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="add-user-name">Full Name</label>
            <input
              id="add-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ava Chen"
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="add-user-email">Email Address</label>
            <input
              id="add-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ava.chen@company.com"
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="add-user-password">Temporary Password</label>
            <input
              id="add-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={fieldClass}
            />
            <p className="text-[12px] font-medium text-gray-500">
              The user signs in with this password — share it with them directly.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="add-user-role">Role</label>
            <select
              id="add-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={cn(fieldClass, 'cursor-pointer')}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[13px] font-bold text-red-500 text-center" role="alert">{error}</p>
        )}

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl h-12 font-bold"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-xl h-12 font-bold bg-[#F5CA50] text-[#111111] hover:brightness-95"
            disabled={isSaving || !canSubmit}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
            {isSaving ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function UserManagementTab() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/users')
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error ?? 'Could not load users.')
        if (!cancelled) setUsers(body.users ?? [])
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function updateRole(id: string, role: UserRole) {
    const previous = users.find((u) => u.id === id)?.role
    if (!previous || previous === role) return

    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    setSavingId(id)
    setError(null)

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? 'Could not update this role.')

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...body.user } : u)))
    } catch (updateError) {
      setError((updateError as Error).message)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: previous } : u)))
    } finally {
      setSavingId(null)
    }
  }

  function handleCreated(user: AppUser) {
    setUsers((prev) => [...prev, user])
    setError(null)
    setToast({ id: Date.now(), kind: 'success', message: `${user.name} was added as ${roleLabels[user.role]}.` })
  }

  const description = loading
    ? 'Loading users…'
    : error
      ? error
      : 'Manage user accounts and roles. User accounts can only be created by administrators.'

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Button
              id="add-user-button"
              className="bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold"
              onClick={() => setShowAddUser(true)}
            >
              <UserPlus className="size-4 mr-2" />
              Add User
            </Button>
          </CardAction>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading users…
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No users to show.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.id} id={`user-row-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs font-semibold">{initialsOf(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <select
                      id={`user-role-${user.id}`}
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(e) => void updateRole(user.id, e.target.value as UserRole)}
                      className={cn(
                        'rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none cursor-pointer disabled:opacity-60',
                        roleColors[user.role],
                      )}
                      aria-label={`Role for ${user.name}`}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatLastLogin(user.lastLogin)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} onCreated={handleCreated} />
      )}

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === 'ADMIN'
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin)

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, API connections, and user accounts
          </p>
        </div>

        <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit" role="tablist">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'api' && <ApiConnectionsTab />}
        {activeTab === 'users' && isAdmin && <UserManagementTab />}
      </div>
    </DashboardShell>
  )
}
