// WordPress module declarations
declare module '@wordpress/block-editor' {
  export const BlockEditorProvider: any;
  export const BlockList: any;
  export const WritingFlow: any;
  export const ObserveTyping: any;
  export const BlockTools: any;
  export const BlockInspector: any;
}

declare module '@wordpress/components' {
  export const Popover: any;
  export const SlotFillProvider: any;
  export const Button: any;
}

declare module '@wordpress/blocks' {
  export const parse: any;
  export const serialize: any;
  export const rawHandler: any;
  export const registerBlockType: any;
}

declare module '@wordpress/block-library/build-style/style.css' {
  const content: any;
  export default content;
}

// WordPress API functions available on window
declare global {
  interface Window {
    wordPressSave?: (data: any) => Promise<any>;
    wordPressUpload?: (file: File) => Promise<any>;
    wordPressUpdateMedia?: (mediaId: number, data: any) => Promise<any>;
  }
}
