'use client'

import {
  Archive,
  BookOpen,
  Brain,
  Camera,
  Check,
  Cloud,
  HardDrive,
  Link,
  Link2Off,
  MessageCircle,
  Send,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getApiConnections, getUsers, type ApiConnection, type AppUser, type UserRole } from '@/lib/mock-data/settings'

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'api' | 'users'

const tabs: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'api', label: 'API Connections' },
  { id: 'users', label: 'User Management' },
]

// ─── Icon map ─────────────────────────────────────────────────────────────────

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

// ─── Role colors ──────────────────────────────────────────────────────────────

const roleColors: Record<UserRole, string> = {
  Admin: 'bg-violet-100 text-violet-700',
  Manager: 'bg-blue-100 text-blue-700',
  Analyst: 'bg-emerald-100 text-emerald-700',
  Viewer: 'bg-muted text-muted-foreground',
}

const roles: UserRole[] = ['Admin', 'Manager', 'Analyst', 'Viewer']

// ─── Profile Tab ──────────────────────────────────────────────────────────────

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
      {/* Avatar card */}
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

      {/* Info form */}
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

// ─── API Connections Tab ───────────────────────────────────────────────────────

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

// ─── User Management Tab ───────────────────────────────────────────────────────

function UserManagementTab() {
  const initial = getUsers()
  const [users, setUsers] = useState<AppUser[]>(initial)

  function updateRole(id: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage user accounts and roles. User accounts can only be created by administrators.
        </CardDescription>
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
            {users.map((user) => (
              <TableRow key={user.id} id={`user-row-${user.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs font-semibold">{user.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <select
                    id={`user-role-${user.id}`}
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                    className={cn(
                      'rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none cursor-pointer',
                      roleColors[user.role],
                    )}
                    aria-label={`Role for ${user.name}`}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, API connections, and user accounts
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit" role="tablist">
          {tabs.map((tab) => (
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

        {/* Tab content */}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'api' && <ApiConnectionsTab />}
        {activeTab === 'users' && <UserManagementTab />}
      </div>
    </DashboardShell>
  )
}
