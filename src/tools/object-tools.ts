/**
 * Object placement tools - place units, doodads, cameras, and regions on maps.
 * Generates Galaxy code for map object creation at runtime.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerObjectTools(server: McpServer): void {
  // object_place_units
  server.tool(
    'object_place_units',
    'Generate Galaxy code to place units on the map. Supports single units, groups, formations, and patrol routes.',
    {
      unitType: z.string().describe('Unit type ID (e.g. "Marine", "Zealot", "Zergling")'),
      positions: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional().default(0),
        facing: z.number().optional().describe('Facing angle in degrees').default(0),
      })).describe('Array of positions to place units'),
      player: z.number().describe('Player ID (0-15)'),
      formation: z.enum(['none', 'line', 'circle', 'grid', 'random_area']).optional().describe('Formation type').default('none'),
      groupName: z.string().optional().describe('Optional group name to assign units to'),
    },
    async ({ unitType, positions, player, formation, groupName }) => {
      const lines: string[] = [];
      lines.push('<!-- Object Placement: ' + unitType + ' -->');
      lines.push('unitgroup g_' + (groupName || unitType + '_Group') + ';');
      lines.push('');
      lines.push('void op_Place' + unitType + '() {');
      lines.push('    g_' + (groupName || unitType + '_Group') + ' = UnitGroupCreate();');
      lines.push('');

      if (formation === 'line' && positions.length >= 2) {
        const start = positions[0];
        const end = positions[positions.length - 1];
        const count = positions.length;
        for (let i = 0; i < count; i++) {
          const t = count > 1 ? i / (count - 1) : 0;
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t;
          const z = (start.z ?? 0) + ((end.z ?? 0) - (start.z ?? 0)) * t;
          lines.push('    UnitGroupAdd(g_' + (groupName || unitType + '_Group') + ', UnitCreate(1, "' + unitType + '", ' + x.toFixed(1) + ', ' + y.toFixed(1) + ', ' + z.toFixed(1) + ', ' + player + '));');
        }
      } else if (formation === 'circle' && positions.length >= 1) {
        const center = positions[0];
        const radius = positions.length > 1 ? Math.sqrt((positions[1].x - center.x) ** 2 + (positions[1].y - center.y) ** 2) : 10;
        const count = positions.length;
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i) / count;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          lines.push('    UnitGroupAdd(g_' + (groupName || unitType + '_Group') + ', UnitCreate(1, "' + unitType + '", ' + x.toFixed(1) + ', ' + y.toFixed(1) + ', ' + (center.z ?? 0).toFixed(1) + ', ' + player + '));');
        }
      } else {
        for (const pos of positions) {
          lines.push('    UnitGroupAdd(g_' + (groupName || unitType + '_Group') + ', UnitCreate(1, "' + unitType + '", ' + pos.x.toFixed(1) + ', ' + pos.y.toFixed(1) + ', ' + (pos.z ?? 0).toFixed(1) + ', ' + player + '));');
        }
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // object_place_doodads
  server.tool(
    'object_place_doodads',
    'Generate Galaxy code to place decorative doodads on the map.',
    {
      doodadType: z.string().describe('Doodad type ID (e.g. "SpacePlatformBarrel", "KorhalPlant")'),
      positions: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional().default(0),
        scale: z.number().optional().default(1),
        rotation: z.number().optional().default(0),
      })),
    },
    async ({ doodadType, positions }) => {
      const lines: string[] = [];
      lines.push('<!-- Doodad Placement: ' + doodadType + ' -->');
      lines.push('void op_PlaceDoodads_' + doodadType.replace(/[^a-zA-Z0-9]/g, '_') + '() {');
      for (const pos of positions) {
        lines.push('    DoodadCreate("' + doodadType + '", ' + pos.x.toFixed(1) + ', ' + pos.y.toFixed(1) + ', ' + (pos.z ?? 0).toFixed(1) + ', ' + (pos.rotation ?? 0).toFixed(1) + ');');
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // object_create_camera
  server.tool(
    'object_create_camera',
    'Generate Galaxy code for camera setup (position, distance, rotation, pitch).',
    {
      cameraName: z.string().describe('Camera identifier'),
      targetX: z.number(),
      targetY: z.number(),
      targetZ: z.number().optional().default(0),
      distance: z.number().optional().describe('Camera distance/zoom').default(20),
      rotation: z.number().optional().describe('Rotation angle in degrees').default(45),
      pitch: z.number().optional().describe('Pitch angle in degrees').default(30),
      player: z.number().optional().describe('Player to apply camera to (-1=all)').default(-1),
    },
    async ({ cameraName, targetX, targetY, targetZ, distance, rotation, pitch, player }) => {
      const lines: string[] = [];
      lines.push('<!-- Camera: ' + cameraName + ' -->');
      lines.push('void cam_' + cameraName.replace(/[^a-zA-Z0-9]/g, '_') + '() {');
      const pStr = player === -1 ? 'c_playerAll' : String(player);
      lines.push('    CameraSetTarget(' + pStr + ', ' + targetX.toFixed(1) + ', ' + targetY.toFixed(1) + ', ' + (targetZ ?? 0).toFixed(1) + ');');
      lines.push('    CameraSetDistance(' + pStr + ', ' + distance.toFixed(1) + ');');
      lines.push('    CameraSetRotation(' + pStr + ', ' + rotation.toFixed(1) + ', 0.0);');
      lines.push('    CameraSetPitch(' + pStr + ', ' + pitch.toFixed(1) + ', 0.0);');
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // object_create_region
  server.tool(
    'object_create_region',
    'Generate Galaxy code to define a rectangular region on the map.',
    {
      regionName: z.string().describe('Region identifier'),
      minX: z.number(),
      minY: z.number(),
      maxX: z.number(),
      maxY: z.number(),
      description: z.string().optional().describe('Region purpose'),
    },
    async ({ regionName, minX, minY, maxX, maxY, description }) => {
      const lines: string[] = [];
      if (description) lines.push('// ' + description);
      lines.push('// Region: ' + regionName + ' (' + minX + ',' + minY + ') to (' + maxX + ',' + maxY + ')');
      lines.push('// Create this region in the Terrain Editor, then reference it by name.');
      lines.push('');
      lines.push('region r_' + regionName + ' = RegionFromId("' + regionName + '");');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // object_create_patrol_route
  server.tool(
    'object_create_patrol_route',
    'Generate Galaxy code for a unit patrol route with waypoints.',
    {
      routeName: z.string().describe('Route identifier'),
      unitGroupRef: z.string().describe('Unit group variable name to patrol'),
      waypoints: z.array(z.object({ x: z.number(), y: z.number() })).describe('Patrol waypoints'),
      loop: z.boolean().optional().describe('Loop back to start').default(true),
    },
    async ({ routeName, unitGroupRef, waypoints, loop }) => {
      const lines: string[] = [];
      lines.push('<!-- Patrol Route: ' + routeName + ' -->');
      lines.push('int pr_' + routeName + '_Index = 0;');
      lines.push('');
      lines.push('void pr_' + routeName + '_NextWaypoint() {');
      lines.push('    unit u = UnitGroupUnitFromIndex(' + unitGroupRef + ', 0);');
      lines.push('    fixed tx, ty;');
      lines.push('    switch (pr_' + routeName + '_Index) {');
      for (let i = 0; i < waypoints.length; i++) {
        lines.push('        case ' + i + ': tx = ' + waypoints[i].x.toFixed(1) + '; ty = ' + waypoints[i].y.toFixed(1) + '; break;');
      }
      lines.push('    }');
      lines.push('    Order o = OrderCreate(u, c_cmdMove);');
      lines.push('    OrderSetTargetPoint(o, tx, ty, 0.0);');
      lines.push('    UnitIssueOrder(u, o);');
      const maxIdx = loop ? waypoints.length - 1 : waypoints.length;
      lines.push('    pr_' + routeName + '_Index = (pr_' + routeName + '_Index + 1) % ' + maxIdx + ';');
      lines.push('}');
      lines.push('');
      lines.push('void pr_' + routeName + '_Init() {');
      lines.push('    trigger t = TriggerCreate("pr_' + routeName + '_NextWaypoint");');
      lines.push('    TriggerAddEventTimePeriodic(t, 5.0, c_timeGame);');
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
