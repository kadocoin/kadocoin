import emailFooter from '../emailFooter';
import emailHeader from '../emailHeader';

export function PromoEmailAlert(data: any): string {
  return `
  ${emailHeader()}
        <table class="es-content" cellspacing="0" cellpadding="0" align="center"
         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
         <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
               <table class="es-content-body"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:640px"
                  cellspacing="0" cellpadding="0" align="center">
                  <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                        <table width="100%" cellspacing="0" cellpadding="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
                                 <table
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:3px;background-color:#FFFFFF"
                                    width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" role="presentation">
                                    <tr style="border-collapse:collapse">
                                       <td align="center"
                                          style="Margin:0;padding-bottom:5px;padding-left:20px;padding-right:20px;padding-top:25px">
                                          <h2
                                             style="Margin:0;line-height:34px;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:28px;font-style:normal;font-weight:bold;color:#444444">
                                              New Google Promo Alert from ${data.customerName}
                                              </h2>
                                       </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                       <td align="left"
                                          style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:20px;padding-right:20px">
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#000000;font-size:20px">
                                             <span class="product-description">
                                                Customer submitted information:
                                             </span>
                                          </p>
                                       </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                       <td align="left"
                                          style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:20px;padding-right:20px">
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                            Business name: ${data.name}
                                          </p>
                                          <br />
                                           <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Short description: ${data.shortDescription}
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Business address: ${data.address}
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                            Website: ${
                                              data.website ? data.website : 'Not submitted'
                                            }
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Hours of operation: ${
                                               data.hours ? data.hours : 'Not submitted'
                                             }
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Business phone number: ${data.phoneNumber}
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Your name: ${data.customerName}
                                          </p>
                                          <br />
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Your email: ${data.email}
                                          </p>
                                           <br />
                                           <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             WhatsApp: ${
                                               data.whatsapp ? data.whatsapp : 'Not submitted'
                                             }
                                          </p>
                                          <p
                                             style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#999999;font-size:16px">
                                             Business logo:
                                             ${
                                               data.businessLogo
                                                 ? `<img
                                             src=${data.businessLogo}
                                             alt="logo"
                                             width="100px"
                                             height="100px"
                                             border-radius="9999px"
                                              />`
                                                 : 'Not submitted'
                                             }
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
  ${emailFooter(data.email)}
  `;
}
