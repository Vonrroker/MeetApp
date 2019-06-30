import { Router } from 'express';
import UserController from './app/controllers/UserController';
import SessionContoller from './app/controllers/SessionController';
import authMiddleware from './app/middlewares/auth';

const routes = Router();

routes.post('/users', UserController.store);

routes.post('/session', SessionContoller.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

export default routes;
