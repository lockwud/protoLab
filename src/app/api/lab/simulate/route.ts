import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { canAccessLabWorkspace } from "@/lib/lab-access";
import type { LabConnection, LabNode } from "@/types";

const schema = z.object({ workspaceId: z.string() });

type Trace = {
  type: "network" | "electronics" | "software" | "system";
  title: string;
  detail: string;
  status: "pass" | "warn" | "fail";
};

const NETWORK_TYPES = ["router", "switch", "access_point", "endpoint", "cable"];
const ELECTRONICS_TYPES = ["microcontroller", "sensor", "actuator", "indicator", "buzzer"];
const SOFTWARE_TYPES = ["screen", "service", "database", "ui_block"];

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });

  try {
    const workspace = await canAccessLabWorkspace(parsed.data.workspaceId, session.userId, session.role);
    if (!workspace) return NextResponse.json({ error: "Build Lab not found." }, { status: 404 });

    const [nodes, connections] = await Promise.all([
      query<LabNode>(`SELECT * FROM "LabNode" WHERE "workspaceId" = $1`, [parsed.data.workspaceId]),
      query<LabConnection>(`SELECT * FROM "LabConnection" WHERE "workspaceId" = $1`, [parsed.data.workspaceId]),
    ]);

    const result = simulateLab(nodes, connections);
    const rows = await query(
      `INSERT INTO "LabSimulation" (id, "workspaceId", status, summary, traces, metrics)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        createId("lbs_"),
        parsed.data.workspaceId,
        result.status,
        result.summary,
        JSON.stringify(result.traces),
        JSON.stringify(result.metrics),
      ]
    );

    return NextResponse.json({ simulation: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to simulate lab." }, { status: 500 });
  }
}

function simulateLab(nodes: LabNode[], connections: LabConnection[]) {
  const traces: Trace[] = [];
  if (nodes.length === 0) {
    traces.push({
      type: "system",
      title: "No prototype assembled",
      detail: "Add devices, components, or software blocks before running the simulation.",
      status: "fail",
    });
    return summarize(nodes, connections, traces, { components: 0, links: 0 });
  }

  const graph = buildGraph(nodes, connections);
  const byType = (types: string[]) => nodes.filter((node) => types.includes(node.type));
  const networkNodes = byType(NETWORK_TYPES);
  const electronicsNodes = byType(ELECTRONICS_TYPES);
  const softwareNodes = byType(SOFTWARE_TYPES);

  if (networkNodes.length > 0) simulateNetwork(nodes, graph, traces);
  const firmware = electronicsNodes.length > 0 ? simulateElectronics(nodes, graph, traces) : null;
  if (softwareNodes.length > 0) simulateSoftware(nodes, graph, traces);
  if (traces.length === 0) {
    traces.push({
      type: "system",
      title: "Prototype recognized",
      detail: "The workspace is saved, but its component types do not map to a supported simulator yet.",
      status: "warn",
    });
  }

  const metrics = {
    components: nodes.length,
    links: connections.length,
    networkComponents: networkNodes.length,
    electronicsComponents: electronicsNodes.length,
    softwareComponents: softwareNodes.length,
    connectedGroups: countConnectedGroups(nodes, graph),
    firmware,
  };
  return summarize(nodes, connections, traces, metrics);
}

function simulateNetwork(nodes: LabNode[], graph: Map<string, Set<string>>, traces: Trace[]) {
  const routers = nodes.filter((node) => node.type === "router");
  const switches = nodes.filter((node) => node.type === "switch");
  const endpoints = nodes.filter((node) => node.type === "endpoint");
  const accessPoints = nodes.filter((node) => node.type === "access_point");
  const infrastructure = [...routers, ...switches, ...accessPoints];

  if (infrastructure.length === 0) {
    traces.push({
      type: "network",
      title: "No network core",
      detail: "Add a router, switch, or access point before testing room-to-room connectivity.",
      status: "fail",
    });
    return;
  }

  for (const endpoint of endpoints) {
    const reachable = infrastructure.some((node) => isReachable(endpoint.id, node.id, graph));
    traces.push({
      type: "network",
      title: `${endpoint.label} reachability`,
      detail: reachable
        ? `${endpoint.label} has a path to network infrastructure.`
        : `${endpoint.label} is isolated. Add or repair a cable path to the switch/router/AP.`,
      status: reachable ? "pass" : "fail",
    });
  }

  if (routers.length > 0 && switches.length > 0) {
    const backboneReady = routers.some((router) => switches.some((sw) => isReachable(router.id, sw.id, graph)));
    traces.push({
      type: "network",
      title: "Router-switch backbone",
      detail: backboneReady
        ? "The LAN backbone has a route between router and switch."
        : "Router and switch exist but are not connected by any saved cable path.",
      status: backboneReady ? "pass" : "fail",
    });
  }

  if (endpoints.length === 0) {
    traces.push({
      type: "network",
      title: "No client endpoint",
      detail: "Add at least one workstation or room endpoint to test service delivery.",
      status: "warn",
    });
  }
}

function simulateElectronics(nodes: LabNode[], graph: Map<string, Set<string>>, traces: Trace[]) {
  const controllers = nodes.filter((node) => node.type === "microcontroller");
  const ioNodes = nodes.filter((node) => ["sensor", "actuator", "indicator", "buzzer"].includes(node.type));
  const estimatedCurrent = ioNodes.reduce((sum, node) => sum + estimatedCurrentMa(node.type), 0);

  if (controllers.length === 0) {
    traces.push({
      type: "electronics",
      title: "No controller board",
      detail: "Arduino/IoT circuits need a microcontroller before sensors or outputs can be read or driven.",
      status: "fail",
    });
    return null;
  }

  for (const component of ioNodes) {
    const wired = controllers.some((controller) => isReachable(component.id, controller.id, graph));
    traces.push({
      type: "electronics",
      title: `${component.label} signal path`,
      detail: wired
        ? `${component.label} has a signal path to a controller.`
        : `${component.label} is not wired to a controller pin or signal path.`,
      status: wired ? "pass" : "fail",
    });
  }

  traces.push({
    type: "electronics",
    title: "Power budget estimate",
    detail: `Estimated load is ${estimatedCurrent}mA against a conservative 500mA USB/board budget.`,
    status: estimatedCurrent > 500 ? "warn" : "pass",
  });

  if (ioNodes.length === 0) {
    traces.push({
      type: "electronics",
      title: "No input/output component",
      detail: "Add a sensor, relay, or indicator so the circuit can demonstrate behavior.",
      status: "warn",
    });
  }

  const connectedOutputs = ioNodes.filter((component) => controllers.some((controller) => isReachable(component.id, controller.id, graph)));
  const firmware = generateArduinoFirmware(connectedOutputs);
  if (firmware) {
    traces.push({
      type: "electronics",
      title: firmware.mode === "beep" ? "Beeper demo generated" : "Blink demo generated",
      detail:
        firmware.mode === "beep"
          ? "A production-ready Arduino sketch was generated to beep a buzzer on pin 8 after upload."
          : "A production-ready Arduino sketch was generated to blink an LED on pin 13 after upload.",
      status: "pass",
    });
  } else {
    traces.push({
      type: "electronics",
      title: "No output demo generated",
      detail: "Wire an LED indicator or buzzer to the Arduino to generate upload-ready blink or beep firmware.",
      status: "warn",
    });
  }
  return firmware;
}

function simulateSoftware(nodes: LabNode[], graph: Map<string, Set<string>>, traces: Trace[]) {
  const screens = nodes.filter((node) => node.type === "screen");
  const uiBlocks = nodes.filter((node) => node.type === "ui_block");
  const services = nodes.filter((node) => node.type === "service");
  const databases = nodes.filter((node) => node.type === "database");

  if (uiBlocks.length > 0) {
    traces.push({
      type: "software",
      title: "Visual screen composition",
      detail: `${uiBlocks.length} draggable UI block(s) are placed on the web prototype canvas for demonstration review.`,
      status: screens.length > 0 ? "pass" : "warn",
    });
  }

  for (const screen of screens) {
    if (services.length === 0) {
      traces.push({
        type: "software",
        title: `${screen.label} visual screen`,
        detail: uiBlocks.length > 0
          ? `${screen.label} has a visual layout for demonstration. Add an API Service when the screen needs backend data.`
          : `${screen.label} is present. Add UI blocks or an API Service to deepen the prototype evidence.`,
        status: uiBlocks.length > 0 ? "pass" : "warn",
      });
      continue;
    }
    const canReachService = services.some((service) => isReachable(screen.id, service.id, graph));
    traces.push({
      type: "software",
      title: `${screen.label} API flow`,
      detail: canReachService
        ? `${screen.label} has a path to an API/service block.`
        : `${screen.label} is not connected to any API/service block.`,
      status: canReachService ? "pass" : "fail",
    });
  }

  if (services.length > 0 && databases.length > 0) {
    const serviceHasStorage = services.some((service) => databases.some((database) => isReachable(service.id, database.id, graph)));
    traces.push({
      type: "software",
      title: "Service persistence",
      detail: serviceHasStorage
        ? "At least one service can reach persistent storage."
        : "Services exist, but none are linked to a database.",
      status: serviceHasStorage ? "pass" : "warn",
    });
  }

  if (screens.length === 0 && services.length === 0 && uiBlocks.length === 0) {
    traces.push({
      type: "software",
      title: "No software entry point",
      detail: "Add a web page or API service to model the application workflow.",
      status: "warn",
    });
  }
}

function summarize(nodes: LabNode[], connections: LabConnection[], traces: Trace[], metrics: Record<string, unknown>) {
  const status = traces.some((trace) => trace.status === "fail")
    ? "FAIL"
    : traces.some((trace) => trace.status === "warn")
      ? "WARN"
      : "PASS";
  const passed = traces.filter((trace) => trace.status === "pass").length;
  const warnings = traces.filter((trace) => trace.status === "warn").length;
  const failures = traces.filter((trace) => trace.status === "fail").length;
  return {
    status,
    summary: `${nodes.length} components, ${connections.length} links simulated: ${passed} passed, ${warnings} warnings, ${failures} failures.`,
    traces,
    metrics,
  };
}

function buildGraph(nodes: LabNode[], connections: LabConnection[]) {
  const graph = new Map<string, Set<string>>();
  nodes.forEach((node) => graph.set(node.id, new Set()));
  connections.forEach((connection) => {
    graph.get(connection.sourceNodeId)?.add(connection.targetNodeId);
    graph.get(connection.targetNodeId)?.add(connection.sourceNodeId);
  });
  return graph;
}

function isReachable(sourceId: string, targetId: string, graph: Map<string, Set<string>>) {
  const seen = new Set<string>();
  const queue = [sourceId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (current === targetId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return false;
}

function countConnectedGroups(nodes: LabNode[], graph: Map<string, Set<string>>) {
  const seen = new Set<string>();
  let groups = 0;
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    groups += 1;
    const queue = [node.id];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      for (const next of graph.get(current) ?? []) queue.push(next);
    }
  }
  return groups;
}

function estimatedCurrentMa(type: string) {
  if (type === "actuator") return 80;
  if (type === "sensor") return 20;
  if (type === "indicator") return 10;
  if (type === "buzzer") return 35;
  return 0;
}

function generateArduinoFirmware(outputs: LabNode[]) {
  const hasBuzzer = outputs.some((node) => node.type === "buzzer" || /buzzer|piezo|speaker/i.test(node.label));
  const hasIndicator = outputs.some((node) => node.type === "indicator" || /led|light/i.test(node.label));
  if (!hasBuzzer && !hasIndicator) return null;

  if (hasBuzzer) {
    return {
      mode: "beep",
      board: "Arduino Uno",
      pin: 8,
      sketch: `const int BUZZER_PIN = 8;

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  tone(BUZZER_PIN, 1000);
  delay(200);
  noTone(BUZZER_PIN);
  delay(800);
}`,
    };
  }

  return {
    mode: "blink",
    board: "Arduino Uno",
    pin: 13,
    sketch: `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}`,
  };
}
