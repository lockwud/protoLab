"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

const SETTINGS_GROUPS = [
  {
    category: "Account & Profile",
    items: [
      { id: "profile", title: "Profile", description: "Name, role, bio, and identity used across submissions and prototype reviews.", key: null },
    ],
  },
  {
    category: "Integrations",
    items: [
      { id: "github", title: "GitHub integration", description: "Repository connection for code evidence, prototype updates, and lecturer supervision.", key: "githubIntegration" },
    ],
  },
  {
    category: "Notifications",
    items: [
      { id: "feedback", title: "Feedback notifications", description: "Get notified when instructors provide feedback on your prototypes.", key: "feedbackNotifications" },
      { id: "milestones", title: "Milestone updates", description: "Receive alerts when milestone statuses change.", key: "milestoneNotifications" },
      { id: "tasks", title: "Project task changes", description: "Stay updated on project task assignments and modifications.", key: "taskNotifications" },
    ],
  },
  {
    category: "Security",
    items: [
      { id: "security", title: "Security settings", description: "Password, session handling, account safety, and institutional access controls.", key: null },
      { id: "audit", title: "Audit readiness", description: "Audit mode in the sidebar highlights institutional review context while keeping your normal workflow intact.", key: "auditMode" },
    ],
  },
];

type NotificationSettings = {
  id: string | null;
  userId: string;
  feedbackNotifications: boolean;
  milestoneNotifications: boolean;
  taskNotifications: boolean;
  githubIntegration: boolean;
  auditMode: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);

  // Fetch settings and user info on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [settingsRes, userRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/auth/me"),
        ]);

        if (!settingsRes.ok) throw new Error("Failed to fetch settings");
        if (!userRes.ok) throw new Error("Failed to fetch user");

        const settingsData = await settingsRes.json();
        const userData = await userRes.json();

        setSettings(settingsData);
        setUser(userData.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = async (key: string | null) => {
    if (!key || !settings) return;

    try {
      setSaving(key);
      setError(null);

      const settingsData = settings as Record<string, unknown>;
      const updatedValue = !(settingsData[key] as boolean);
      
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: updatedValue }),
      });

      if (!res.ok) throw new Error("Failed to update settings");

      const updated = await res.json();
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 animate-pulse">
          <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
          <div className="h-8 w-48 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">System setup</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Manage account context, integrations, notifications, and review preferences for ProtoLab.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
              {user?.name.slice(0, 1).toUpperCase() || "?"}
            </span>
            <div>
              <h2 className="text-lg font-semibold">{user?.name || "User"}</h2>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{user?.role.toLowerCase()}</Badge>
            <Badge variant="outline">{user?.email}</Badge>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.category}</h3>
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              {group.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-start justify-between gap-4 p-4 ${
                    index < group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Toggle 
                    checked={item.key ? (settings as Record<string, unknown>)[item.key] === true : false}
                    onCheckedChange={() => handleToggle(item.key)}
                    disabled={!item.key || saving === item.key}
                    className="mt-1 flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
