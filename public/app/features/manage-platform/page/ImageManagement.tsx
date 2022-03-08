import React from 'react';
import { Button, Card, HorizontalGroup, IconButton, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

// TODO: Perfect styling

export const ImageManagement = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.imageMgmtContainer}>
      <div className={styles.imageContainer}>
        <Card heading="nginx">
          <Card.Meta>
            <a key="link2" href="https://hub.docker.com/_/nginx">
              https://hub.docker.com/_/nginx
            </a>
          </Card.Meta>
          <Card.Figure>
            <img src={'https://1000logos.net/wp-content/uploads/2020/08/Nginx-Symbol.jpg'} alt="nginx Logo" />
          </Card.Figure>
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
        <Card heading="mqtt">
          <Card.Meta>
            <a key="link2" href="https://hub.docker.com/_/mqtt">
              https://hub.docker.com/_/mqtt
            </a>
          </Card.Meta>
          <Card.Figure>
            <img src={'https://i2.wp.com/benchodroff.com/wp-content/uploads/2017/10/mqtt.png'} alt="mqtt Logo" />
          </Card.Figure>
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
        <Card heading="grafana-agent">
          <Card.Meta>
            <a key="link2" href="https://hub.docker.com/r/grafana/agent">
              https://hub.docker.com/r/grafana/agent
            </a>
          </Card.Meta>
          <Card.Figure>
            <img
              src={'https://www.clipartmax.com/png/small/450-4503037_grafana-prometheus-grafana-logo.png'}
              alt="grafana Logo"
            />
          </Card.Figure>
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
        <Card heading="kafka">
          <Card.Meta>
            <a key="link2" href="https://hub.docker.com/r/bitnami/kafka">
              https://hub.docker.com/r/bitnami/kafka
            </a>
          </Card.Meta>
          <Card.Figure>
            <img
              src={
                'https://svn.apache.org/repos/asf/kafka/site/logos/originals/png/ICON%20-%20White%20on%20Transparent.png'
              }
              alt="kafka Logo"
            />
          </Card.Figure>
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
        <Card heading="aws-iot-greengrass">
          <Card.Meta>
            <a key="link2" href="https://hub.docker.com/r/amazon/aws-iot-greengrass">
              https://hub.docker.com/r/amazon/aws-iot-greengrass
            </a>
          </Card.Meta>
          <Card.Figure>
            <img
              src={'https://dashboard.snapcraft.io/site_media/appmedia/2020/05/AWS-IoT-Greengrass4x.png'}
              alt="aws iot greengrass Logo"
            />
          </Card.Figure>
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
        <Card heading="Iris™">
          <Card.Actions>
            <Button icon="play">Start</Button>
            <Button icon="square-shape" variant="secondary">
              Stop
            </Button>
          </Card.Actions>
          <Card.SecondaryActions>
            <IconButton key="delete" name="trash-alt" tooltip="Delete this image" />
          </Card.SecondaryActions>
        </Card>
      </div>
      <div className={styles.buttonsContainer}>
        <HorizontalGroup spacing="lg">
          <Button icon="plus">Add</Button>
        </HorizontalGroup>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  imageMgmtContainer: css`
    display: flex;
    flex-direction: column;
  `,
  imageContainer: css`
    margin-top: 30px;
    flex-grow: 1;
  `,
  buttonsContainer: css`
    margin-top: 10px;
    align-self: flex-start;
  `,
});
