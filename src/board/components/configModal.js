import h from 'react-hyperscript';
import Modal from 'react-modal';
import { useState } from 'react';
import helpers from 'hyperscript-helpers';
import { t } from '../../i18n';

const tags = helpers(h);
const { div, img, i, nav, a, p } = tags;
const { span, h2, form, input, label, textarea } = tags;

export function ConfigModal({ state, effects, setOpen }) {
    const { site } = state;
    const [changes, setChange] = useState({});
    const dirty = Object.keys(changes).length > 0;
    const [sending, setSending] = useState(false);

    async function onSubmit(event) {
        event.preventDefault();
        if (sending) {
            return;
        }
        setSending(true);
        await Promise.resolve(effects.requestConfigSave({ changes }));
        setSending(false);
        setChange({});
    }

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
                    a('.active', [i('.icon-cog.mr1'), t`General`]),
                    a([i('.icon-th-list-outline.mr1'), t`Categorias`]),
                    a([i('.icon-lock-open.mr1'), t`Permisos`]),
                    a([i('.icon-picture-outline.mr1'), t`Diseño`]),
                ]),
                div('.flex-auto', [
                    form({ id: 'update-site', onSubmit }, [
                        div('.flex.items-center.header', [
                            h2('.flex-auto', t`General`),
                            dirty === true &&
                                span([
                                    input('.btn.btn-inline', {
                                        type: 'button',
                                        value: t`Cancelar`,
                                        onClick: () => setChange({}),
                                    }),
                                ]),
                            dirty === true &&
                                span([
                                    input('.btn.btn-primary.btn-inline', {
                                        type: 'submit',
                                        value: t`Guardar cambios`,
                                    }),
                                ]),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', t`Nombre del sitio`),
                            input('.form-input', {
                                name: 'name',
                                type: 'text',
                                placeholder: t`Ej. Comunidad de Anzu`,
                                required: true,
                                value:
                                    'name' in changes
                                        ? changes.name
                                        : site.name,
                                onChange: event =>
                                    setChange({
                                        ...changes,
                                        name: event.target.value,
                                    }),
                            }),
                            p(
                                '.form-input-hint',
                                t`Mostrado alrededor del sitio, el nombre de tu comunidad.`
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', t`Descripción del sitio`),
                            textarea('.form-input', {
                                name: 'description',
                                placeholder: '...',
                                rows: 3,
                                value:
                                    'description' in changes
                                        ? changes.description
                                        : site.description,
                                onChange: event =>
                                    setChange({
                                        ...changes,
                                        description: event.target.value,
                                    }),
                            }),
                            p(
                                '.form-input-hint',
                                t`Para metadatos, resultados de busqueda y dar a conocer tu comunidad.`
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', t`Dirección del sitio`),
                            input('.form-input', {
                                name: 'url',
                                type: 'text',
                                placeholder: 'Ej. https://comunidad.anzu.io',
                                required: true,
                                value:
                                    'site' in changes ? changes.url : site.url,
                                onChange: event =>
                                    setChange({
                                        ...changes,
                                        url: event.target.value,
                                    }),
                            }),
                            p(
                                '.form-input-hint.lh-copy',
                                t`URL absoluta donde vive la instalación de Anzu. Utilizar una dirección no accesible puede provocar no poder acceder al sitio.`
                            ),
                        ]),
                    ]),
                    form('.bt.b--light-gray.pt2', { id: 'links' }, [
                        div('.form-group', [
                            label('.b.form-label', t`Menu de navegación`),
                            p(
                                '.form-input-hint',
                                t`Mostrado en la parte superior del sitio. (- = +)`
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
