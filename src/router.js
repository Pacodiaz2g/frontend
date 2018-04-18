import xs from 'xstream';
import { Board } from './containers/board';

export function AnzuRouter(sources) {
    const match$ = sources.router.define({
        '/': Board,
        '/p/:slug/:id': (slug, id) => {
            return sources =>
                Board({
                    ...sources,
                    props$: xs.of({ slug, id }),
                });
        },
    });

    const page$ = match$.map(({ path, value }) => {
        return value({ ...sources, router: sources.router.path(path) });
    });

    return {
        DOM: page$.map(c => c.DOM).flatten(),
        HTTP: page$.map(c => c.HTTP).flatten(),
        history: page$.map(c => c.history).flatten(),
        router: page$.map(c => c.router).flatten(),
    };
}
