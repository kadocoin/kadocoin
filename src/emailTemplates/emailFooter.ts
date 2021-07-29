export default function emailFooter(email: string): string {
  return `
   <table cellpadding="0" cellspacing="0" class="es-footer" align="center"
         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
               <table class="es-footer-body" cellspacing="0" cellpadding="0" align="center"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#F6F6F6;width:640px">
                  <tr style="border-collapse:collapse">
                     <td align="left"
                        style="Margin:0;padding-left:20px;padding-right:20px;padding-top:40px;padding-bottom:40px">
                        <table width="100%" cellspacing="0" cellpadding="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
                                 <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                    <tr style="border-collapse:collapse">
                                       <td align="center" style="padding:0;Margin:0;padding-bottom:5px;font-size:0"><a
                                             target="_blank" href="https://dankoresoft.com"
                                             style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#999999;font-size:14px"><img
                                                src="https://res.cloudinary.com/my-nigerian-projects/image/upload/v1614570748/gwandara/profilePictures/fm1sxos8jvci1id0lnzf.png"
                                                alt="Logo"
                                                style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                title="Logo" width="80"></a></td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                       <td align="center"
                                          style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px">
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#999999;font-size:14px">
                                             PO Box 511, <br>Charles City Iowa 50616, USA.<br></p>
                                             <p
                                                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#999999;font-size:14px">
                                                <p>
                                                <a target="_blank" href="https://dankoresoft.com/#get-quote">Free Quote</a> |
                                                   <a target="_blank" href="https://dankoresoft.com/register">Register</a> | <a
                                                      target="_blank" href="https://dankoresoft.com/login">Login</a> | 
                                                      <a target="_blank"
                                                         href="https://dankoresoft.com/newsletter/unsubscribe/${email}">Unsubscribe</a>
                                                </p>
                                                 <p>
                                                    <a target="_blank" href="https://wa.me/message/UMXZ5XBAYMXSC1">WhatsApp</a> |
                                                    <a target="_blank"
                                                       href="https://www.facebook.com/dankoresoftware">Facebook</a>
                                                    | <a target="_blank" href="https://twitter.com/dankoresoftware">Twitter</a>
                                                    |
                                                    <a target="_blank"
                                                       href="https://www.instagram.com/dankoresoftware">Instagram</a>
                                                 </p>
                                                <p
                                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#999999;font-size:14px">
                                                   Copyright © 2021 Kadocoin, All Rights Reserved.
                                                </p>
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                           </tr>
                        </table>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
     `;
}
