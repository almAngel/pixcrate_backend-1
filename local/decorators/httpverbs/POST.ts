// POST decorator registers a POST HTTP endpoint for a controller method.
// It supports authentication (sealed endpoints), content negotiation, and request/response metadata handling.
// The decorated method is invoked after authentication and request processing.

import { ContentType } from "../../enum/ContentType";
import { AbstractController } from "../../controllers/AbstractController";
import { handledSend } from "../../helpers/Tools";
import TokenManager from "../../helpers/TokenManager";
import AuthBridge from "../../helpers/AuthBridge";
import * as publicIp from "public-ip";
import { GenericDAO } from "../../schemas/dao/GenericDAO";
import { UserSchema } from "../../schemas/UserSchema";
import { App } from "../../../bootstrapper";
import bodyParser from "body-parser";
import formidable from "express-formidable";

/**
 * POST HTTP verb decorator for REST controllers.
 * @param path - The route path for the POST endpoint.
 * @param produces - The content type produced by the endpoint (default: text/plain).
 * @param consumes - The content type consumed by the endpoint (default: text/plain).
 * @param sealed - If true, the endpoint requires authentication via px-token header.
 */
export function POST({ path, produces = ContentType.TEXT_PLAIN, consumes = ContentType.TEXT_PLAIN, sealed = false }: { path: string; produces?: ContentType; consumes?: ContentType; sealed?: boolean }) {
    //Initialize variables
    let originalMethod: Function;
    let result: any;
    let response: any;
    let bridge: AuthBridge;
    let genericDAO: GenericDAO<UserSchema>;
    let middleware: any;

    let doDummy = async (req: any, res: any, next: any) => {
        // Handles authentication, sets headers, and prepares metadata for the controller method.
        response = "";
        res.setHeader("Content-type", produces);
        if (sealed) {
            let token = req.header("px-token");
            if (token) {
                try {
                    if (!TokenManager.expired(token)) {
                        genericDAO = new GenericDAO(UserSchema);
                        let n = await genericDAO.count({ access_token: token });
                        if (n == 1) {
                            AbstractController.setMetadata("px-token", req.header("px-token"));
                        } else {
                            response = {
                                msg: "Unauthorized: User not found",
                                status: 403
                            }
                        }
                    }
                } catch (e) {
                    // Type assertion to access 'message' property safely
                    if ((e as Error).message == "invalid signature") {
                        response = {
                            msg: "Error: Malformed access token",
                            status: 400
                        }
                    } else {
                        bridge = new AuthBridge(await publicIp.publicIp(), token);
                        response = await bridge.response;
                    }
                }
            } else {
                response = {
                    msg: "Unauthorized: Access token required",
                    status: 403
                }
            }
        }
        AbstractController.setMetadata("request", req);
        AbstractController.setMetadata("response", res);
        AbstractController.setMetadata("urlParams", req.params);
        AbstractController.setMetadata("status", 200);
        AbstractController.setMetadata("next", next);
        if (response) {
            handledSend(response);
        }
    }

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
        // Wraps the original method to register the POST route and handle request processing.
        originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            let finalPath = String(args[0] + path).replace("//", "/");
            if (consumes == ContentType.APP_JSON || consumes == undefined ) {
                result = App.serverManager.getInstance().post(finalPath, [bodyParser.json(), bodyParser.urlencoded({ extended: true })], async (req: any, res: any, next: any) => {
                    await doDummy(req, res, next);
                    originalMethod.apply(this, args);
                });
            } else if (consumes == ContentType.IMAGE_JPEG) {
                result = App.serverManager.getInstance().post(finalPath, formidable(), async (req: any, res: any, next: any) => {
                    await doDummy(req, res, next);
                    originalMethod.apply(this, args);
                });
            } else {
                result = App.serverManager.getInstance().post(finalPath, async (req: any, res: any, next: any) => {
                    await doDummy(req, res, next);
                    originalMethod.apply(this, args);
                });
            }
        }
        return result;
    }
}