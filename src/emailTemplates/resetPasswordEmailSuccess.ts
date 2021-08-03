import emailFooter from './emailFooter';
import emailHeader from './emailHeader';
import { tableRow } from './table';

export function ResetPasswordEmailSuccess(name: string, email: string): string {
  return ` ${emailHeader()}
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
                                       <td align="left"
                                          style="Margin:0;padding-bottom:5px;padding-left:20px;padding-right:20px;padding-top:25px">
                                          <h2
                                             style="Margin:0;line-height:34px;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:28px;font-style:normal;font-weight:bold;color:#444444">
                                             ${name ? 'Hello ' + name : 'Hello'}!
                                          </h2>
                                       </td>
                                    </tr>

                                      ${tableRow('You have successfully reset your password')}
                                     
                                     ${tableRow(
                                       'If you did not make this request, please contact support@kadocoin.org IMMEDIATELY!'
                                     )}

                                    ${tableRow(
                                      'If you have any questions, just reply to this email — we are always happy  to help out'
                                    )}
                                    ${tableRow('Cheers <br /> Kadocoin')}
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
       ${emailFooter(email)}`;
}
