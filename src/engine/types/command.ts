export interface ICommand {
  readonly label: string;
  execute(): void;
  undo(): void;
}
