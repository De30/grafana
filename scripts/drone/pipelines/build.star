load(
    'scripts/drone/steps/lib.star',
    'benchmark_ldap_step',
    'betterer_frontend_step',
    'build_backend_step',
    'build_docker_images_step',
    'build_frontend_package_step',
    'build_frontend_step',
    'build_image',
    'build_plugins_step',
    'build_storybook_step',
    'cloud_plugins_e2e_tests_step',
    'compile_build_cmd',
    'copy_packages_for_docker_step',
    'download_grabpl_step',
    'e2e_tests_artifacts',
    'e2e_tests_step',
    'enterprise_downstream_step',
    'frontend_metrics_step',
    'grafana_server_step',
    'identify_runner_step',
    'memcached_integration_tests_step',
    'mysql_integration_tests_step',
    'package_step',
    'postgres_integration_tests_step',
    'publish_images_step',
    'redis_integration_tests_step',
    'release_canary_npm_packages_step',
    'store_storybook_step',
    'test_a11y_frontend_step',
    'trigger_oss',
    'trigger_test_release',
    'upload_cdn_step',
    'upload_packages_step',
    'verify_gen_cue_step',
    'verify_gen_jsonnet_step',
    'wire_install_step',
    'yarn_install_step',
)

load(
    'scripts/drone/utils/utils.star',
    'pipeline',
)


def build_e2e(trigger, ver_mode):
    edition = 'oss'
    environment = {'EDITION': edition}
    init_steps = [
        identify_runner_step(),
        download_grabpl_step(),
        compile_build_cmd(),
        verify_gen_cue_step(),
        verify_gen_jsonnet_step(),
        wire_install_step(),
        yarn_install_step(),
    ]

    build_steps = []
    variants = None

    if ver_mode == 'pr':
        build_steps.extend(
            [
                trigger_test_release(),
                enterprise_downstream_step(ver_mode=ver_mode),
            ]
        )

        variants = [
            'linux-amd64',
            'linux-amd64-musl',
            'darwin-amd64',
            'windows-amd64',
        ]

    build_steps.extend(
        [
            build_backend_step(edition=edition, ver_mode=ver_mode),
            build_frontend_step(edition=edition, ver_mode=ver_mode),
            build_frontend_package_step(edition=edition, ver_mode=ver_mode),
            build_plugins_step(edition=edition, ver_mode=ver_mode),
            package_step(edition=edition, ver_mode=ver_mode, variants=variants),
            grafana_server_step(edition=edition),
            e2e_tests_step('dashboards-suite'),
            e2e_tests_step('smoke-tests-suite'),
            e2e_tests_step('panels-suite'),
            e2e_tests_step('various-suite'),
            cloud_plugins_e2e_tests_step(
                'cloud-plugins-suite',
                cloud='azure',
                trigger=trigger_oss,
            ),
            e2e_tests_artifacts(),
            build_storybook_step(ver_mode=ver_mode),
            copy_packages_for_docker_step(),
            test_a11y_frontend_step(ver_mode=ver_mode),
        ]
    )

    if ver_mode == 'main':
        build_steps.extend(
            [
                store_storybook_step(ver_mode=ver_mode, trigger=trigger_oss),
                frontend_metrics_step(trigger=trigger_oss),
                build_docker_images_step(
                    edition=edition, ver_mode=ver_mode, publish=False
                ),
                build_docker_images_step(
                    edition=edition, ver_mode=ver_mode, publish=False, ubuntu=True
                ),
                publish_images_step(
                    edition=edition,
                    ver_mode=ver_mode,
                    mode='',
                    docker_repo='grafana',
                    trigger=trigger_oss,
                ),
                publish_images_step(
                    edition=edition,
                    ver_mode=ver_mode,
                    mode='',
                    docker_repo='grafana-oss',
                    trigger=trigger_oss,
                ),
                release_canary_npm_packages_step(trigger=trigger_oss),
                upload_packages_step(
                    edition=edition, ver_mode=ver_mode, trigger=trigger_oss
                ),
                upload_cdn_step(
                    edition=edition, ver_mode=ver_mode, trigger=trigger_oss
                ),
            ]
        )
    elif ver_mode == 'pr':
        build_steps.extend(
            [
                build_docker_images_step(
                    edition=edition,
                    ver_mode=ver_mode,
                    archs=[
                        'amd64',
                    ],
                )
            ]
        )

    publish_suffix = ''
    if ver_mode == 'main':
        publish_suffix = '-publish'

    return pipeline(
        name='{}-build-e2e{}'.format(ver_mode, publish_suffix),
        edition="oss",
        trigger=trigger,
        services=[],
        steps=init_steps + build_steps,
        environment=environment,
    )
