load(
    'scripts/drone/steps/lib.star',
    'identify_runner_step',
    'download_grabpl_step',
    'publish_images_step',
    'compile_build_cmd',
    'fetch_images_step',
)

load(
    'scripts/drone/utils/utils.star',
    'pipeline',
)


def publish_image_steps(edition, mode, docker_repo):
    steps = [
        identify_runner_step(),
        download_grabpl_step(),
        compile_build_cmd(),
        fetch_images_step(edition),
        publish_images_step(edition, 'release', mode, docker_repo),
    ]

    if edition == 'oss':
        steps.append(
            publish_images_step(edition, 'release', mode, 'grafana/grafana-oss')
        )

    return steps


def publish_image_pipelines_public():
    mode = 'public'
    trigger = {
        'event': ['promote'],
        'target': [mode],
    }
    return [
        pipeline(
            name='publish-docker-oss-{}'.format(mode),
            trigger=trigger,
            steps=publish_image_steps(edition='oss', mode=mode, docker_repo='grafana'),
            edition="",
            environment={'EDITION': 'oss'},
        ),
        pipeline(
            name='publish-docker-enterprise-{}'.format(mode),
            trigger=trigger,
            steps=publish_image_steps(
                edition='enterprise', mode=mode, docker_repo='grafana-enterprise'
            ),
            edition="",
            environment={'EDITION': 'enterprise'},
        ),
    ]


def publish_image_pipelines_security():
    mode = 'security'
    trigger = {
        'event': ['promote'],
        'target': [mode],
    }
    return [
        pipeline(
            name='publish-docker-enterprise-{}'.format(mode),
            trigger=trigger,
            steps=publish_image_steps(
                edition='enterprise', mode=mode, docker_repo='grafana-enterprise'
            ),
            edition="",
            environment={'EDITION': 'enterprise'},
        ),
    ]
