import { ROOT_NODE_ADDRESS } from '../config/secret';
import emailFooter from './emailFooter';
import emailHeader from './emailHeader';
import { tableRow, tableRowAlwaysHappy, tableRowCheers, tableRowHeadline } from './table';

export function registrationWelcomeEmailPostVerification({ email }: { email: string }): string {
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
                                    ${tableRowHeadline(`Welcome to Kadocoin`)}
                                    ${tableRow(
                                      'Thank you for registering your account at Kadocoin!'
                                    )}
                                    ${tableRow(
                                      'If you ever encounter any problem or issue using our service, please contact us at support@dankoresoft.com.'
                                    )}

                                    ${tableRow(
                                      `We welcome you to follow our <a href="${ROOT_NODE_ADDRESS}/blog">Blog</a> for the latest press releases, updates regarding Kadocoin services and products updates.`
                                    )}
                                    ${tableRow(
                                      'Make sure you follow us on social media. See footer for links.'
                                    )}
                                     ${tableRowAlwaysHappy()}
                                     ${tableRowCheers()}
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
