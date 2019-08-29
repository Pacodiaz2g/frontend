import h from 'react-hyperscript';
import Modal from 'react-modal';
import classNames from 'classnames';
import helpers from 'hyperscript-helpers';
import { Fragment, useState } from 'react';
import { t } from '../../i18n';

const tags = helpers(h);
const {
    div,
    a,
    p,
    form,
    input,
    select,
    option,
    textarea,
    label,
    span,
    h2,
} = tags;

export function ConfirmWithReasonLink(props) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    function onSubmit(event) {
        event.preventDefault();
        if (reason.length === 0) {
            return;
        }
        setReason('');
        setOpen(false);
        props.onConfirm(reason);
    }
    return h(Fragment, [
        a(
            '.pointer.post-action',
            {
                onClick: () => setOpen(true),
            },
            props.children || []
        ),
        open === true &&
            h(
                Modal,
                {
                    isOpen: open,
                    onRequestClose: () => setOpen(false),
                    ariaHideApp: false,
                    contentLabel: props.action || 'Feedback',
                    className: 'feedback-modal',
                    style: {
                        overlay: {
                            zIndex: 301,
                            backgroundColor: 'rgba(0, 0, 0, 0.30)',
                        },
                    },
                },
                [
                    div('.modal-container', { style: { width: '360px' } }, [
                        props.title && div('.modal-title.mb3', props.title),
                        form({ onSubmit }, [
                            div('.form-group', [
                                input('.form-input', {
                                    onChange: event =>
                                        setReason(event.target.value),
                                    value: reason,
                                    type: 'text',
                                    placeholder:
                                        props.placeholder ||
                                        t`Escribe el motivo de esta acción...`,
                                    required: true,
                                    autoFocus: true,
                                }),
                            ]),
                            input('.btn.btn-primary.btn-block', {
                                type: 'submit',
                                disabled: reason.length === 0,
                                value: props.action || 'Continuar',
                            }),
                        ]),
                    ]),
                ]
            ),
    ]);
}
export function Flag(props) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const reasons = ['spam', 'rude', 'duplicate', 'needs_review', 'other'];
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const disabled = !reason.length || (reason === 'other' && !content.length);

    async function onSubmit(event) {
        event.preventDefault();
        if (disabled || sending) {
            return;
        }
        setSending(true);
        await Promise.resolve(props.onFlag({ reason, content }));
        setSending(false);
        setOpen(false);
    }

    return h(Fragment, [
        a(
            '.pointer.post-action',
            {
                onClick: () => setOpen(true),
            },
            props.children || []
        ),
        open === true &&
            h(
                Modal,
                {
                    isOpen: open,
                    onRequestClose: () => setOpen(false),
                    ariaHideApp: false,
                    contentLabel: props.action || 'Feedback',
                    className: 'feedback-modal',
                    style: {
                        overlay: {
                            zIndex: 301,
                            backgroundColor: 'rgba(0, 0, 0, 0.30)',
                        },
                    },
                },
                [
                    div('.modal-container', { style: { width: '360px' } }, [
                        form('.modal-body', { onSubmit }, [
                            props.title && p(props.title),
                            select(
                                '.form-select.w-100.mb2',
                                {
                                    value: reason,
                                    onChange: event =>
                                        setReason(event.target.value),
                                },
                                [
                                    option(
                                        { value: '' },
                                        t`Selecciona una opcion`
                                    ),
                                ].concat(
                                    reasons.map(reason =>
                                        option({ value: reason }, t`${reason}`)
                                    )
                                )
                            ),
                            reason == 'other' &&
                                div('.form-group', [
                                    textarea('.form-input', {
                                        name: 'description',
                                        placeholder: t`Escribe el motivo...`,
                                        value: content,
                                        onChange: event =>
                                            setContent(event.target.value),
                                        rows: 3,
                                    }),
                                ]),
                            input('.btn.btn-primary.btn-block', {
                                disabled,
                                type: 'submit',
                                value: props.action || 'Continuar',
                                className: classNames({ loading: sending }),
                            }),
                        ]),
                    ]),
                ]
            ),
    ]);
}

export function BanWithReason(props) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const reasons = ['spam', 'rude', 'abuse', 'spoofing', 'other'];
    const disabled = !reason.length || (reason === 'other' && !content.length);

    async function onSubmit(event) {
        event.preventDefault();
        if (disabled || sending) {
            return;
        }
        setSending(true);
        await Promise.resolve(props.onBan({ reason, content }));
        setSending(false);
        setOpen(false);
    }

    return h(Fragment, [
        a(
            '.pointer.post-action',
            {
                onClick: () => setOpen(true),
            },
            props.children || []
        ),
        open === true &&
            h(
                Modal,
                {
                    isOpen: open,
                    onRequestClose: () => setOpen(false),
                    ariaHideApp: false,
                    contentLabel: props.action || 'Feedback',
                    className: 'feedback-modal',
                    style: {
                        overlay: {
                            zIndex: 301,
                            backgroundColor: 'rgba(0, 0, 0, 0.30)',
                        },
                    },
                },
                [
                    div('.modal-container', { style: { width: '360px' } }, [
                        form('.modal-body', { onSubmit }, [
                            props.title && p(props.title),
                            select(
                                '.form-select.w-100.mb2',
                                {
                                    value: reason,
                                    onChange: event =>
                                        setReason(event.target.value),
                                },
                                [
                                    option(
                                        { value: '' },
                                        t`Selecciona una opcion`
                                    ),
                                ].concat(
                                    reasons.map(reason =>
                                        option({ value: reason }, t`${reason}`)
                                    )
                                )
                            ),
                            reason == 'other' &&
                                div('.form-group', [
                                    textarea('.form-input', {
                                        name: 'description',
                                        placeholder: t`Escribe el motivo...`,
                                        value: content,
                                        onChange: event =>
                                            setContent(event.target.value),
                                        rows: 3,
                                    }),
                                ]),
                            input('.btn.btn-primary.btn-block', {
                                disabled,
                                type: 'submit',
                                value: props.action || 'Continuar',
                                className: classNames({ loading: sending }),
                            }),
                        ]),
                    ]),
                ]
            ),
    ]);
}

export function updateSite(props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [sending, setSending] = useState(false);
    const disabled = !name.length || !description.length || !url.lengt;

    async function onSubmit(event) {
        event.preventDefault();
        if (sending) {
            return;
        }
        setSending(true);
        await Promise.resolve(props.onUpdateSite({ name, description, url }));
        setSending(false);
        setOpen(false);
    }
    return h(Fragment, [
        a(
            '.pointer.post-action',
            {
                onClick: () => setOpen(true),
            },
            props.children || []
        ),
        open != true &&
            h(
                Modal,
                {
                    isOpen: open,
                    onRequestClose: () => setOpen(false),
                    ariaHideApp: false,
                    contentLabel: props.action || 'Feedback',
                    className: 'feedback-modal',
                    style: {
                        overlay: {
                            zIndex: 301,
                            backgroundColor: 'rgba(0, 0, 0, 0.30)',
                        },
                    },
                },
                [
                    form({ id: 'update-site' }, { onSubmit }, [
                        div('.flex.items-center.header', [
                            h2('.flex-auto', 'General'),
                            span([
                                input('.btn.btn-primary.btn-block', {
                                    disabled,
                                    type: 'submit',
                                    value: 'Guardar cambios',
                                }),
                            ]),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Nombre del sitio'),
                            input('.form-input', {
                                name: 'name',
                                type: 'text',
                                placeholder: 'Ej. Comunidad de Anzu',
                                required: true,
                                value: name,
                                onChange: event => setName(event.target.value),
                            }),
                            p(
                                '.form-input-hint',
                                'Mostrado alrededor del sitio, el nombre de tu comunidad.'
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Descripción del sitio'),
                            textarea('.form-input', {
                                name: 'description',
                                placeholder: '...',
                                rows: 3,
                                required: true,
                                value: description,
                                onChange: event =>
                                    setDescription(event.target.value),
                            }),
                            p(
                                '.form-input-hint',
                                'Para metadatos, resultados de busqueda y dar a conocer tu comunidad.'
                            ),
                        ]),
                        div('.form-group', [
                            label('.b.form-label', 'Dirección del sitio'),
                            input('.form-input', {
                                name: 'url',
                                type: 'text',
                                placeholder: 'Ej. https://comunidad.anzu.io',
                                required: true,
                                value: url,
                                onChange: event => setUrl(event.target.value),
                            }),
                            p(
                                '.form-input-hint.lh-copy',
                                'URL absoluta donde vive la instalación de Anzu. Utilizar una dirección no accesible puede provocar no poder acceder al sitio.'
                            ),
                        ]),
                    ]),
                ]
            ),
    ]);
}
