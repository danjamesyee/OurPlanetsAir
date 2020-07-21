export const sizeLegend = (selection, props) => {
  const { sizeScale, spacing, textOffset } = props;

  const ticks = sizeScale.ticks(5).filter((d) => d !== 0);
};
