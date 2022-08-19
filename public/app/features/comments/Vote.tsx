import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';

interface Props {
  id: number;
  rating: number;
  onChange: (id: number, rating: number) => void;
}

export const Vote = (props: Props) => {
  const { id, onChange } = props;
  const styles = useStyles2(getStyles);
  const [rating, setRating] = useState(props.rating);

  return (
    <div className={styles.votecontainer}>
      <Icon
        name="plus"
        onClick={() => {
          const upRating = rating + 1;
          setRating(upRating);
          onChange(id, upRating);
        }}
      />
      {rating}
      <Icon
        name="minus"
        onClick={() => {
          const downRating = rating - 1;
          setRating(downRating);
          onChange(id, downRating);
        }}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  votecontainer: css`
    width: 25px;
    text-align: center;
  `,
});
