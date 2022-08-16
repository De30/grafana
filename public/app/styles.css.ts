import { style } from '@vanilla-extract/css';

export const container = style({
  border: '3px solid #f79533',
  borderImage: `linear-gradient(45deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82) 1`,

  // Normal container styles
  display: 'flex',
  alignItems: 'stretch',
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
});
