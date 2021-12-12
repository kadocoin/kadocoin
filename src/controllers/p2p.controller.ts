/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR, SUCCESS } from '../statusCode/statusCode';

export default class P2PController {
  getPeers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const peers = await req.p2p.getPeers();
      return res.status(SUCCESS).json({ type: 'success', message: peers });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };
}
