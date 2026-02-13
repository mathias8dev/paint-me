import type { BaseTool } from './BaseTool';
import { PencilTool } from './PencilTool';
import { EraserTool } from './EraserTool';
import { LineTool } from './LineTool';
import { RectangleTool } from './RectangleTool';
import { CircleTool } from './CircleTool';
import { FillTool } from './FillTool';
import { TextTool } from './TextTool';
import { SelectionTool } from './SelectionTool';
import { EyedropperTool } from './EyedropperTool';
import { SprayTool } from './SprayTool';
import { PolygonTool } from './PolygonTool';
import { ArrowTool } from './ArrowTool';
import { PasteTool } from './PasteTool';
import type { ToolType, ToolConfig } from '../types';
import type { LayerManager } from '../layers';
import type { LayerCompositor } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class ToolRegistry {
  private tools: Map<ToolType, BaseTool> = new Map();
  private activeTool: BaseTool;
  private currentConfig!: ToolConfig;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    const pencil = new PencilTool(layerManager, commandHistory, viewport);
    const eraser = new EraserTool(layerManager, commandHistory, viewport);
    const line = new LineTool(layerManager, commandHistory, viewport);
    const rectangle = new RectangleTool(layerManager, commandHistory, viewport);
    const circle = new CircleTool(layerManager, commandHistory, viewport);
    const fill = new FillTool(layerManager, commandHistory, viewport);
    const text = new TextTool(layerManager, commandHistory, viewport);
    const selection = new SelectionTool(layerManager, commandHistory, viewport);
    const eyedropper = new EyedropperTool(layerManager, commandHistory, viewport);
    const spray = new SprayTool(layerManager, commandHistory, viewport);
    const polygon = new PolygonTool(layerManager, commandHistory, viewport);
    const arrow = new ArrowTool(layerManager, commandHistory, viewport);
    const paste = new PasteTool(layerManager, commandHistory, viewport);

    this.register(pencil);
    this.register(eraser);
    this.register(line);
    this.register(rectangle);
    this.register(circle);
    this.register(fill);
    this.register(text);
    this.register(selection);
    this.register(eyedropper);
    this.register(spray);
    this.register(polygon);
    this.register(arrow);
    this.register(paste);

    this.activeTool = pencil;
  }

  private register(tool: BaseTool): void {
    this.tools.set(tool.type, tool);
  }

  getActiveTool(): BaseTool {
    return this.activeTool;
  }

  setActiveTool(type: ToolType): void {
    const tool = this.tools.get(type);
    if (!tool) return;

    this.activeTool.onDeactivate();
    this.activeTool = tool;
    if (this.currentConfig) {
      this.activeTool.setConfig(this.currentConfig);
    }
    this.activeTool.onActivate();
  }

  getTool(type: ToolType): BaseTool | undefined {
    return this.tools.get(type);
  }

  updateConfig(config: ToolConfig): void {
    this.currentConfig = config;
    this.activeTool.setConfig(config);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  setupEyedropper(compositor: LayerCompositor, onColorPick: (color: string) => void): void {
    const eyedropper = this.tools.get('eyedropper') as EyedropperTool | undefined;
    if (eyedropper) {
      eyedropper.setCompositor(compositor);
      eyedropper.setColorPickCallback(onColorPick);
    }
  }

  setupTextTool(cb: (point: { x: number; y: number }, onConfirm: (text: string) => void) => void): void {
    const textTool = this.tools.get('text') as TextTool | undefined;
    if (textTool) {
      textTool.setTextCallback(cb);
    }
  }

  setupSelectionTool(cb: (rect: { x: number; y: number; width: number; height: number } | null) => void): void {
    const selectionTool = this.tools.get('selection') as SelectionTool | undefined;
    if (selectionTool) {
      selectionTool.setSelectionCallback(cb);
    }
  }
}
