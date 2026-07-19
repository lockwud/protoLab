import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getProject, listMilestonesForProject, listFeedbackForProject } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneBoard } from "./milestone-board";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { GithubPanel } from "./github-panel";
import { FeedbackPanel } from "./feedback-panel";
import { RepositoryPublishPanel } from "./repository-publish-panel";
import { ProjectSettingsForm } from "./project-settings-form";
import { BuildLabPanel } from "./build-lab-panel";
import { PrototypeInviteButton, PrototypeShareButton } from "../prototype-actions";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await getProject(id);
  if (!project) notFound();
  if (user.role === "STUDENT" && project.ownerId !== user.id) notFound();

  const [milestones, feedback] = await Promise.all([
    listMilestonesForProject(id),
    listFeedbackForProject(id),
  ]);

  const isOwner = user.id === project.ownerId;
  const canReview = user.role === "LECTURER" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>{project.status}</Badge>
              <Badge variant="outline">Prototype workspace</Badge>
            </div>
            <h1 className="font-display text-3xl font-semibold">{project.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{project.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <PrototypeInviteButton title={project.title} projectId={project.id} />
            <PrototypeShareButton title={project.title} summary={project.summary} projectId={project.id} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="build" className="mt-8">
        <TabsList>
          <TabsTrigger value="build">Build Lab</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="build">
          <BuildLabPanel project={project} milestones={milestones} />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestoneBoard projectId={project.id} milestones={milestones} canEdit={isOwner || canReview} />
        </TabsContent>

        <TabsContent value="assistant">
          <AiAssistantPanel projectId={project.id} project={project} />
        </TabsContent>

        <TabsContent value="github">
          <GithubPanel project={project} canEdit={isOwner} />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackPanel projectId={project.id} feedback={feedback} canReview={canReview} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings">
            <div className="flex flex-col gap-6">
              <ProjectSettingsForm project={project} />
              <RepositoryPublishPanel projectId={project.id} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
