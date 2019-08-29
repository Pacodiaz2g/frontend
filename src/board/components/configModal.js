import h from 'react-hyperscript';
import Modal from 'react-modal';
import helpers from 'hyperscript-helpers';
import { t } from '../../i18n';
import { updateSite } from './actions';

const tags = helpers(h);
const { div, img, i, nav, a, p } = tags;
const { span, form, input, label } = tags;

export function ConfigModal({ state, effects, setOpen }) {
    const { site } = state;
    return h(
        Modal,
        {
            isOpen: true,
            onRequestClose: () => setOpen(false),
            ariaHideApp: false,
            contentLabel: t`Configuración`,
            className: 'config-modal',
            style: {
                overlay: {
                    zIndex: 301,
                    backgroundColor: 'rgba(0, 0, 0, 0.30)',
                },
            },
        },
        div('.modal-container.config.fade-in', { style: { width: '640px' } }, [
            div('.flex', [
                nav([
                    a([
                        img('.w3', {
                            src: '/images/anzu.svg',
                            alt: 'Anzu',
                        }),
                    ]),
                    a('.active', [i('.icon-cog.mr1'), 'General']),
                    a([i('.icon-th-list-outline.mr1'), 'Categorias']),
                    a([i('.icon-lock-open.mr1'), 'Permisos']),
                    a([i('.icon-picture-outline.mr1'), 'Diseño']),
                ]),
                div('.flex-auto', [
                    h(updateSite, {
                        onUpdateSite: form =>
                            effects.requestConfigSave({ ...form }),
                    }),
                    form('.bt.b--light-gray.pt2', { id: 'links' }, [
                        div('.form-group', [
                            label('.b.form-label', 'Menu de navegación'),
                            p(
                                '.form-input-hint',
                                'Mostrado en la parte superior del sitio. (- = +)'
                            ),
                            div(
                                site.nav.map((link, k) => {
                                    return div(
                                        '.input-group.mb2.fade-in',
                                        { key: `link-${k}` },
                                        [
                                            span(
                                                '.input-group-addon',
                                                {},
                                                i('.icon-up-outline')
                                            ),
                                            span(
                                                '.input-group-addon',
                                                {},
                                                i('.icon-down-outline')
                                            ),
                                            input('.form-input', {
                                                dataset: { id: String(k) },
                                                name: 'name',
                                                type: 'text',
                                                placeholder: '...',
                                                value: link.name,
                                                required: true,
                                            }),
                                            input('.form-input', {
                                                dataset: { id: String(k) },
                                                name: 'href',
                                                type: 'text',
                                                placeholder: '...',
                                                value: link.href,
                                                required: true,
                                            }),
                                        ]
                                    );
                                })
                            ),
                        ]),
                    ]),
                ]),
            ]),
        ])
    );
}
