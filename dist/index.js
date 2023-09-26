import { initProcessHanlder, processHandler } from '@bits_devel/process-handler';
const start = () => {
    initProcessHanlder();
    const ph = processHandler();
    ph.onStart(async () => console.log('Eine Manko gab es, die Blicke der Menschen.'));
    ph.addExitMiddleware(async () => console.log('Bye!'));
    ph.gracefulStart();
};
start();
