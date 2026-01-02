import Link from "next/link"
import { siteConfig } from "@/config/site"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {siteConfig.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Hệ thống giám sát Autoland của đội tàu bay VietJet
            </p>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Vietjet AMO - ICT Department
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span>{" "}
                  <a
                    href="mailto:moc@vietjetair.com"
                    className="text-vj-red hover:underline"
                  >
                    moc@vietjetair.com
                  </a>
                </p>
              </li>
              <li>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href="https://www.amoict.com"
                    target="_blank"
                    className="text-vj-red hover:underline"
                  >
                    https://www.amoict.com
                  </a>
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Vietjet Aviation Joint Stock Company</p>
            <p className="mt-2 md:mt-0">
            <span className="font-medium"></span>{" "}
                  <a
                    href="https://vietjetair.com"
                    target="_blank"
                    className="text-vj-red hover:underline"
                  >
                    Vietjet Air
                  </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

