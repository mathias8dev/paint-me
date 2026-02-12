import type { ToolType, ToolConfig, PointerEventData } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export abstract class BaseTool {
  readonly type: ToolType;
  readonly label: string;
  readonly shortcutKey: string;

  protected config!: ToolConfig;
  protected layerManager: LayerManager;
  protected commandHistory: CommandHistory;
  protected viewport: Viewport;

  constructor(
    type: ToolType,
    label: string,
    shortcutKey: string,
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    this.type = type;
    this.label = label;
    this.shortcutKey = shortcutKey;
    this.layerManager = layerManager;
    this.commandHistory = commandHistory;
    this.viewport = viewport;
  }

  onActivate(): void {}
  onDeactivate(): void {}

  setConfig(config: ToolConfig): void {
    this.config = config;
  }

  abstract getCursor(): string;
  abstract onPointerDown(event: PointerEventData): void;
  abstract onPointerMove(event: PointerEventData): void;
  abstract onPointerUp(event: PointerEventData): void;

  getPreviewCanvas(): OffscreenCanvas | null {
    return null;
  }
}
